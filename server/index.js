const express = require('express');
const app = express();
const cors = require('cors');
const port = 3042;
const EC = require('elliptic').ec;
const SHA256 = require('crypto-js/sha256');

// localhost can have cross origin errors
// depending on the browser you use!
app.use(cors());
app.use(express.json());

const balances = {};

//Generate key pairs and initial balances
for(let i = 0; i < 10; i++) {
  const ec = new EC('secp256k1');
  const key = ec.genKeyPair();
  const publicKey = key.getPublic().encode('hex');
  const privateKey = key.getPrivate().toString(16);

  console.log(
    publicKey + " WITH A PRIVATE KEY OF: " + privateKey + " HAS A BALANCE OF [100]"
  );
  balances[publicKey] = 100;
}

app.get('/balance/:address', (req, res) => {
  const {address} = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post('/send', (req, res) => {
  const ec = new EC('secp256k1');
  const {sender, recipient, message, signature} = req.body;

  //VERIFY
  const publicKey = sender.toString();
  const key = ec.keyFromPublic(publicKey, 'hex');
  const msg = message;
  const msgHashed = SHA256(msg).toString();

  //If verified
  if(key.verify(msgHashed, signature) === true) {
    //If available funds
    if (balances[sender] >= message.amount) {
      balances[sender] -= message.amount;
      balances[recipient] = (balances[recipient] || 0) + message.amount;
      res.send({ balance: balances[sender] });
    }
    else {
      console.log("ERROR: Insufficient funds");
      res.send("error");
    }
  }
  else {
    console.log("ERROR: Public / Private key mismatch");
    console.log(`Attempted by ${sender} to ${recipient}`);
    res.send("error");
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});
