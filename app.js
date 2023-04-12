
// Get a random integer between 0 and 9
function getRandomInt() {
  return Math.floor(Math.random() * 10);
}

// Listen for the "Get Available Address" button click
document.getElementById('getAddressBtn').addEventListener('click', async () => {

  try {
    let address = localStorage.getItem('userAddress');
    const addressContainer = document.getElementById('addressContainer');
    addressContainer.style.display = 'block';

    if (!address) {
      // Set the App credentials
      const credentials = 'u0wk7bviu4:6rFc_Jelo1WVbjMtfbOqQk0GFwK0czb428kgrom1Vgo';
      const encodedCredentials = btoa(credentials);

      // API endpoint to retrieve available addresses
      const url = 'https://u0fa6mg3lo-u0zscxmwe9-connect.us0-aws.kaleido.io/gateways/caribcontract/0x70f10bd254bc76a9d1c7c3c08e9c5c06580f3d20/availableAddresses?input=' + getRandomInt();

      // Make a request using fetch
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${encodedCredentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }

      const data = await response.json();
      address = data.output;
      localStorage.setItem('userAddress', address);
    }

    // Display the retrieved address on the page
    const addressDisplay = document.getElementById('addressDisplay');
    addressDisplay.innerText = address;
  } catch (error) {
    console.error(error);
    // Display error message
    alert('Error getting an address, please try again!');
  }
});


document.getElementById('viewBalanceBtn').addEventListener('click', async () => {
  try {
    const credentials = 'u0wk7bviu4:6rFc_Jelo1WVbjMtfbOqQk0GFwK0czb428kgrom1Vgo';
    const encodedCredentials = btoa(credentials);
    const balanceContainer = document.getElementById('balanceContainer');
    balanceContainer.style.display = 'block';
    const url = 'https://u0fa6mg3lo-u0zscxmwe9-connect.us0-aws.kaleido.io/gateways/caribcontract/0x70f10bd254bc76a9d1c7c3c08e9c5c06580f3d20/getBalance?lenderAddress=0xc6ba694c95cb2cc8845085f4d39f17b73932d8ba';

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }

    const data = await response.json();
    const balance = data.output;
    const balanceDisplay = document.getElementById('balanceDisplay');
    balanceDisplay.innerText = `${balance} ETH`;
  } catch (error) {
    console.error(error);
    alert('Error getting balance, please try again!');
  }
});

document.getElementById('borrowFundsBtn').addEventListener('click', () => {
  const borrowFundsForm = document.getElementById('borrowFundsForm');
  borrowFundsForm.style.display = 'block';
});

document.getElementById('submitBorrowFundsBtn').addEventListener('click', async () => {
  const amount = document.getElementById('amount').value;
  const processingMessage = document.getElementById('processingMessage');
  processingMessage.style.display = 'block';
  firebase.auth().onAuthStateChanged(async function(user) {
    if (user) {
      // User is signed in.
      const username = user.displayName || user.email;
      console.log(username);

      try {
        // Set the App credentials
        const credentials = 'u0wk7bviu4:6rFc_Jelo1WVbjMtfbOqQk0GFwK0czb428kgrom1Vgo';
        const encodedCredentials = btoa(credentials);
        const address = localStorage.getItem('userAddress');
        const addressInput = document.getElementById('address');
        addressInput.value = address;

        // API endpoint to borrow funds
        const url = `https://u0fa6mg3lo-u0zscxmwe9-connect.us0-aws.kaleido.io/gateways/caribcontract/${address}/borrowFunds?kld-from=0xc6ba694c95cb2cc8845085f4d39f17b73932d8ba&kld-ethvalue=${amount}&kld-sync=true`;
        // Call the borrowFunds function with the amount value entered by the user
        // Make a request using fetch
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${encodedCredentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            "amountToBorrow": `${amount}`,
            "borrowerName": `${username}`,
            "lender": "0xc6ba694c95cb2cc8845085f4d39f17b73932d8ba"
          })
        });

        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        const txHash = data.transactionHash;
      // Hide the "Please wait..." message and display the transaction hash
      const borrowFundsForm = document.getElementById('borrowFundsForm');
      borrowFundsForm.style.display = 'none';
      processingMessage.style.display = 'none';
      const transactionDisplay = document.getElementById('transactionDisplay');
      transactionDisplay.innerText = `Transaction Hash: ${txHash}`;
      transactionDisplay.style.display = 'block';
        // Add transaction details to the database
        addTransaction(username, amount, txHash);
        console.log('Transaction details added to the database');
      } catch (error) {
        console.error(error);
        // Display error message
        alert('Error borrowing funds, please try again!');
      }
    } else {
      // No user is signed in.
      console.log('No user is signed in.');
    }
  });
});

async function addTransaction(borrowerName, amount, txHash) {
  try {
    const db = firebase.firestore();
    const user = firebase.auth().currentUser;
    const userId = user ? user.uid : '';
    const timestamp = firebase.firestore.FieldValue.serverTimestamp();
    const transaction = {
      borrowerName,
      amount,
      txHash,
      userId,
      timestamp
    };

    await db.collection('transactions').add(transaction);
  } catch (error) {
    console.error(error);
    // Display error message
    alert('Error adding transaction, please try again!');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const getRecentTransactionsBtn = document.getElementById('viewTransactionsBtn');
  const transactionsDisplay = document.getElementById('transactionsDisplay');
  transactionsDisplay.style.display = 'none';
  const transactionsTableBody = document.getElementById('transactionsTableBody');

  function getRecentTransactions() {
    console.log('getRecentTransactions function called');

    // Clear existing rows
    while (transactionsTableBody.firstChild) {
      transactionsTableBody.removeChild(transactionsTableBody.firstChild);
    }

    // Get the 10 most recent transactions from Firestore
    const db = firebase.firestore();
    db.collection('transactions')
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get()
      .then((querySnapshot) => {
        console.log('Retrieved data from Firestore:', querySnapshot.docs);
        querySnapshot.forEach((doc) => {
          const transactionData = doc.data();
          console.log('Transaction data:', transactionData);

          // Create new row in the transactions table
          console.log("Creating new row in transactions table");
          const newRow = transactionsTableBody.insertRow();
          const borrowerNameCell = newRow.insertCell();
          const amountCell = newRow.insertCell();
          const transactionHashCell = newRow.insertCell();
          const dateCell = newRow.insertCell();

          // Populate the cells with transaction data
          console.log("Populating transactions table");
          borrowerNameCell.innerHTML = transactionData.borrowerName;
          amountCell.innerHTML = transactionData.amount;
          transactionHashCell.innerHTML = transactionData.txHash;
          dateCell.innerHTML = new Date(transactionData.timestamp.seconds * 1000).toLocaleString();
          console.log("transactions table fully populated");
        });
      })
      .catch((error) => {
        console.error('Error retrieving data from Firestore:', error);
      });
  }

  getRecentTransactionsBtn.addEventListener('click', () => {
    transactionsDisplay.style.display = 'block';
    document.querySelector('.table-header-row').style.display = 'table-row';
    getRecentTransactions();
  });

});
