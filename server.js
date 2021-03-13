const express = require('express');
const cookieParser = require('cookie-parser');
const app = express();

// Google auth
const {OAuth2Client} = require('google-auth-library');
const CLIENT_ID = '654002685162-05of2jjo6hd2dlvllt1l6g9voscf701i.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

const PORT = process.env.PORT || 5001;

app.set('view engine', 'ejs');
app.use(express.json()); 
app.use(cookieParser());
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.render('login');
})

app.post('/login', (req, res) => {
  let token = req.body.token;
  console.log(token);

  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    console.log(payload);
  }

  verify()
  .then(() => {
    res.cookie('session-token', token);
    res.send('success');
  })
  .catch(console.error);
})

app.get('/dashboard', checkAuth, (req, res) => {
  let user = req.user;
  res.render('dashboard', { user });
  res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
})

app.get('/protectedroute', checkAuth, (req, res) => {
  res.render('protectedroute');
})

app.get('/logout', (req, res) => {
  res.clearCookie('session-token');
  res.redirect('/');
})

function checkAuth(req, res, next) {
  let token = req.cookies['session-token'];
  let user = {};
  
  async function verify() {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    user.given_name = payload.given_name;
    user.email = payload.email;
    user.picture = payload.picture;
  }
  
  verify()
  .then(() => {
    req.user = user;
    next();
  })
  .catch(err => {
    res.redirect('/login')
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
})
