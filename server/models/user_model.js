const { query } = require('../util/db')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const got = require('got')

const saltLength = parseInt(process.env.SALT_LENGTH)
const iterationRound = parseInt(process.env.ITERATION_ROUND)
const accessTokenExpiredTime = 60 * 60

const User = {}

// Founded return [true,email], Not Found return [false, email]
User.checkIfEmailExist = async function (email) {
  const sql = 'SELECT email FROM users WHERE email = ? ;'
  const result = await query(sql, [email])
  if (result.length === 1) {
    return [true, email]
  } else {
    return [false, email]
  }
}

User.lockTable = async function () {
  await query('LOCK TABLES users WRITE;')
}

User.unLockTable = async function () {
  await query('UNLOCK TABLES;')
}

User.generatePwdSalt = function () {
  return crypto.randomBytes(saltLength).toString('hex')
}

User.generatePwdHash = function (password, salt) {
  return crypto.pbkdf2Sync(password, salt, iterationRound, 64, 'sha512').toString('hex')
}

User.generateToken = function (email, name) {
  const playload = {
    iss: 'stylish',
    sub: name,
    email: email,
    exp: Math.floor(Date.now() / 1000) + accessTokenExpiredTime
  }
  return jwt.sign(playload, process.env.JWT_PRIVATEKEY)
}

User.createUser = async function (email, name, password, providerName) {
  // Hash password
  const salt = providerName === 'native' ? User.generatePwdSalt() : null
  const hash = providerName === 'native' ? User.generatePwdHash(password, salt) : null

  // Generate Token
  const accessToken = User.generateToken(email, name)

  // Set User Avatar
  const defaultUserAvatar = 'default-user-avatar.png'

  // Get Provider ID
  const providerID = providerName === 'native' ? 1 : 2

  // Create user object
  const user = {
    email: email,
    name: name,
    pwd_hash: hash,
    pwd_salt: salt,
    picture: defaultUserAvatar,
    access_token: accessToken,
    provider_id: providerID
  }
  await query('INSERT INTO users SET ?', user)
}

User.getUser = async function (email, token = null) {
  const values = []
  let sql = `SELECT u.id, p.name AS "provider", u.name, u.email, u.picture, u.pwd_hash, u.pwd_salt, u.access_token
            FROM users AS u
            INNER JOIN user_provider AS p ON u.provider_id = p.id 
            WHERE u.email = ? `
  values.push(email)
  if (token !== null) {
    sql += 'AND u.access_token = ? ;'
    values.push(token)
  }
  const result = await query(sql, values)
  if (result.length === 1) {
    const r = JSON.parse(JSON.stringify(result[0]))
    const user = {
      hash: r.pwd_hash,
      salt: r.pwd_salt,
      response: {
        data: {
          access_token: r.access_token,
          access_expired: accessTokenExpiredTime,
          user: {
            id: r.id,
            provider: r.provider,
            name: r.name,
            email: r.email,
            picture: '/imgs/' + r.picture
          }
        }
      }
    }
    return user
  } else {
    const err = new Error('Access Invaid, please try to sign in again.')
    err.status = 400
    throw err
  }
}

User.updateToken = async function (email, accessToken) {
  const sql = `UPDATE users SET access_token = ?
                    WHERE email = ?`
  await query(sql, [accessToken, email])
}

User.signup = async function (email, name, password) {
  const emailCheck = await User.checkIfEmailExist(email)
  if (emailCheck[0]) {
    const err = new Error(`e-mail: ${emailCheck[1]} already exist, try to sign in`)
    err.status = 403
    throw err
  }
  await User.createUser(email, name, password, 'native')
  const user = await User.getUser(email)
  return user
}

User.signinByEmail = async function (email, password) {
  const user = await User.getUser(email)
  if (user.response.data.user.provider !== 'native') {
    const err = new Error(`You sign up with ${user.response.data.user.provider}, please continue with ${user.response.data.user.provider}`)
    err.status = 403
    throw err
  }
  const signInPwdHash = User.generatePwdHash(password, user.salt)
  if (user.hash === signInPwdHash) {
    const accessToken = User.generateToken(email, user.response.data.user.name)
    await User.updateToken(email, accessToken)
    const updatedUser = await User.getUser(email)
    return updatedUser
  } else {
    const err = new Error("Password doesn't match, please try again")
    err.status = 403
    throw err
  }
}

User.signInByFacebook = async function (accessToken) {
  const user = await got(`https://graph.facebook.com/me/?access_token=${accessToken}&fields=id,name,email`)
  const { name } = JSON.parse(user.body)
  const { email } = JSON.parse(user.body)
  const emailCheck = await User.checkIfEmailExist(email)
  if (emailCheck[0]) {
    const accessToken = User.generateToken(email, name)
    await User.updateToken(email, accessToken)
    const updatedUser = await User.getUser(email)
    return updatedUser
  } else {
    await User.createUser(email, name, null, 'facebook')
    const createdUser = await User.getUser(email)
    return createdUser
  }
}

User.verifyUserByToken = async function (accessToken) {
  const head = accessToken.split(' ')[0]
  if (head !== 'Bearer') {
    const err = new Error("Token preceding text error'")
    err.status = 400
    throw err
  }
  const decoded = jwt.verify(accessToken.replace('Bearer ', ''), process.env.JWT_PRIVATEKEY)
  if (decoded.exp < Math.floor(Date.now() / 1000)) {
    const err = new Error('Token Expired, please sign in again')
    err.status = 400
    throw err
  }
  const user = await User.getUser(decoded.email, accessToken.replace('Bearer ', ''))
  return user
}

module.exports = User
