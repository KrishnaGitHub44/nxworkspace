//import { v4 as uuidv4 } from 'uuid';
//import uuid from 'crypto';
import express from 'express';
import { randomUUID } from 'crypto';
//import { json } from 'stream/consumers';
//import { products } from './products';
import { scheduleJob } from 'node-schedule'



const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const saveEnergyApp = express();

// dailyJobRunner to increament simulated date and update the deposites to balance

let lastSimulatedDay = 0;
const period = 5;

(async function() {
    scheduleJob('*/1 * * * *', async function() {

        if ((lastSimulatedDay % period === 0) && lastSimulatedDay > 0) {
          calculateInterest(lastSimulatedDay)
        }
        lastSimulatedDay += 1
        console.log("running",lastSimulatedDay)
        const dailyJobs = new updateDaily(lastSimulatedDay);
        dailyJobs.updateDepositsDaily(lastSimulatedDay);
        //calculateInterest(lastSimulatedDay)
        //dailyJobs.updateProductsDaily(lastSimulatedDay)
        //updateDepositsDaily(Deposits)
        //updatedProductsDaily()
        //console.log("Deposits:",Deposits)
        //console.log("Accounts:",Accounts)
        //console.log("Products:", products)
        //console.log("Purchases:",Purchases)
    });
})();

// ****** Adding the products here as the import is giving me an error ********

interface product
  {
    id: string,
    title: string,
    description: string,
    stock: number,
    price: number,
    simulatedday?:number
  }
const products:product[] = [
  {
    id: "solar",
    title: "Solar Panel",
    description: "Super duper Essent solar panel",
    stock: 10,
    price: 750,
    simulatedday: 0
  },
  {
    id: "insulation",
    title: "Insulation",
    description: "Cavity wall insulation",
    stock: 10,
    price: 2500,
    simulatedday: 0
  },
  {
    id: "heatpump",
    title: "Awesome Heatpump",
    description: "Hybrid heat pump",
    stock: 3,
    price: 5000,
    simulatedday: 0
  },
];
interface Account {
  id: string,
  name: string,
  balance: number,
  interest?: number
}

const Accounts:Account[] = [];
saveEnergyApp.use(express.json());

// Function to check if the input is empty
const Empty = (payload:string | Account | Deposit[] | purchase | number| product[] ) => {
  return Object.keys(payload).length === 0;
}

// Function to filter based on accountId.

const filterAccount = (accountId: string) =>{
  const indx = Accounts.findIndex(Object => {
    return Object.id === accountId
  });
  if (indx !== -1) {
  
  return Accounts[indx];
  };
};

// *********** PART A ***************
saveEnergyApp.post('/accounts', (req, res) => {
//const requestmessage = req.body;
//console.log(req.body);
const isEmpty = Object.keys(req.body).length === 0;

if ( !isEmpty ) {
  const accountInputData:Account = {id:randomUUID(), name:req.body.name, balance: 0, interest: 0}
  Accounts.push(accountInputData)
  //console.log(Accounts)
  //res.statusMessage = 'Success'
  const {interest, ...responseData } = accountInputData;
  res.send(responseData);
}
else { 
  res.statusMessage = 'Invalid Input';
  res.status(400).end();
  //res.send();
}
});

saveEnergyApp.get('/accounts', (req, res) => {
  res.status(201)
  //res.statusMessage =  'Success'
  res.send(Accounts);
});

saveEnergyApp.get('/accounts/:accountId', (req, res) => {
  const AccountId = req.params.accountId;
  const indx = Accounts.findIndex(Object => {
    return Object.id === AccountId
  })
  if (indx !== -1){
    res.status(200)
    res.send(Accounts[indx])
  } else {
    res.statusMessage = 'Not Found'
    res.status(404).end();
  }
})

// ********* PART B ***************
interface Deposit {
  id:string,
  accountid:string,
  amount: number,
  simulatedday:number,
  completed:boolean
}

const Deposits:Deposit[] = [];

class updateDaily {
  simulatedday:number
  constructor(simulatedday:number){
    this.simulatedday = simulatedday
  }
  updateDepositsDaily(simulatedday:number):void {

    if(!Empty(Deposits)) {
    const depositesUpdate = Deposits.filter((Object) => { 
      return Object.simulatedday <= simulatedday && Object.completed === false;
    })
    console.log(depositesUpdate);
    depositesUpdate.forEach((deposit) => {
      const indx = Accounts.findIndex((Object) => {
        return Object.id === deposit.accountid
      });
      Accounts[indx].balance += deposit.amount
    })
    const indx = Deposits.findIndex((Object) => {
      return Object.completed === false
    });
    if (indx !== -1) {
    Deposits[indx].completed = true;
    }
    }
  }

  updateProductsDaily(simulatedday:number):void {
      products.forEach((product, index) => {
        products[index].simulatedday = simulatedday
      })
  }
}
/*
const updateDepositsDaily = (Deposits:Deposit[]) =>{

  if(!Empty(Deposits)) {
  const depositesUpdate = Deposits.filter((Object) => { 
    return Object.simulatedday <= lastSimulatedDay && Object.completed === false;
  })
  console.log(depositesUpdate);
  depositesUpdate.forEach((deposit) => {
    const indx = Accounts.findIndex((Object) => {
      return Object.id === deposit.accountid
    });
    Accounts[indx].balance += deposit.amount
  })
  const indx = Deposits.findIndex((Object) => {
    return Object.completed === false
  });
  if (indx !== -1) {
  Deposits[indx].completed = true;
  }
}
}
const updatedProductsDaily = () => {
  products.forEach((product, index) => {
    products[index].simulatedday = lastSimulatedDay
  })
}
*/
saveEnergyApp.post('/accounts/:accountId/deposits', (req, res) => {
  if(!Empty(req.body)) {
    const filteredAccData = filterAccount(req.params.accountId)
    if(!Empty(filteredAccData)){
      const simdayheader = parseInt(String(req.headers['simulated-day']));
      console.log(simdayheader)
      const depositId= randomUUID();
      const inputData:Deposit= {id:depositId, accountid:filteredAccData.id, amount:req.body.amount, simulatedday: simdayheader,completed: false}
      console.log(inputData);
      Deposits.push(inputData)
      res.status(201)
      res.send({id:depositId, name:filteredAccData.name, balance: filteredAccData.balance})
    } else {
      res.statusMessage = 'Account does not exist ';
      res.status(400).end();
    }
  } else {
    res.statusMessage = 'Invalid Input';
    res.status(400).end();
  }
})

const filterProducts = (productId:string) => {
  const indx = products.findIndex(Object => {
    return Object.id === productId
  })
  return indx;
}

interface purchase {
  accountId : string, // accountId
  productId: string,
  price: number,
  simulatedday: number  
}

const Purchases:purchase[] = [{accountId: '123',productId: '12345', price: 200, simulatedday: 2}];

const filterPurchases = (accountId:string) => {
  //const purchaseWithId = Purchases.filter((purchase) => purchase.accountId === accountId)
  const max = Purchases.reduce((prev, current) => (prev && prev.simulatedday > current.simulatedday) ? prev : current)
  console.log("Latest:", max)
  return max
}

saveEnergyApp.post('/accounts/:accountId/purchases', (req, res) => {
  const customerId = req.params.accountId;
  if(!Empty(req.body)) {
    const filteredAccData = filterAccount(customerId)
    const lastpurchase = filterPurchases(customerId)
    console.log("Lastpurchase:",lastpurchase);
    //const depositeDetails = filterDeposites (req.params.accountId)
    if(!Empty(filteredAccData)){
      const simdayheader = parseInt(String(req.headers['simulated-day']));
      //console.log(lastpurchase.simulatedday)
      let lastpurchasesimday = 0;
      if (!Empty(lastpurchase)){
        lastpurchasesimday = lastpurchase.simulatedday
      }
      //console.log("lastpurchasesimday:",lastpurchasesimday)
      const productindx = filterProducts(req.body.productId)

     /* ******* This is handled in Daily Job Runner **********

       const depositesWithId = Deposits.filter((Object) => { 
        return Object.accountid === req.params.accountId && Object.simulatedday < simdayheader;
      })
      console.log(depositesWithId);
      const totaldeposites = depositesWithId.reduce((total,Item) => {
        return total + Item.amount;
      }, 0) 

      const purchasesWithId = Purchases.filter((Object) => {
        return Object.accountId === customerId;
      })
      const totalpurchases = purchasesWithId.reduce((total,Item) => {
        return total+Item.price;
      },0 ) */
      const outstandingbal = filteredAccData.balance
      // const outstandingbal = filteredAccData.balance + filteredAccData.interest
      // console.log(filteredAccData.interest)
      // console.log("outbal",outstandingbal, "totaldep",filteredAccData.balance, "totalpurchase",totalpurchases, "productprice",products[productindx].price)
      if(products[productindx].stock >= 1 ) {

        if ( lastpurchasesimday < simdayheader && lastSimulatedDay <= simdayheader && products[productindx].simulatedday <= simdayheader) {
          if (outstandingbal > products[productindx].price) {
            const inputData:purchase= {accountId:req.params.accountId, productId:products[productindx].id, price:products[productindx].price, simulatedday: simdayheader}
            Purchases.push(inputData)
            // console.log("Purchases:", Purchases)
            // console.log("Input:", inputData)
            products[productindx].stock -= 1
            const indx = Accounts.findIndex(Object => {
              return Object.id === req.params.accountId
            })
            Accounts[indx].balance -= products[productindx].price;
            //console.log(products[productindx].stock)
            res.sendStatus(201)
          } else {
            res.statusMessage = 'Not enough funds';
            res.sendStatus(409).end();
          }
        } else {
           res.statusMessage = 'Illegal Sim Day'
           res.sendStatus(400).end()
        }
      } else {
        res.statusMessage = 'Not enough stock'
        res.sendStatus(409).end();
      }
    }  else {
      res.statusMessage = 'Account does not exist ';
      res.status(400).end();
    }
  } else {
    res.statusMessage = 'Invalid Input';
    res.status(400).end();
  }
})

saveEnergyApp.post('/products', (req, res) => {
  if(!Empty(req.body)) {
    const inputProduct:product = {id:randomUUID(), title:req.body.title, description:req.body.description, stock: req.body.stock, price: req.body.price, simulatedday: lastSimulatedDay}
    //console.log(inputProduct);
    products.push(inputProduct)
    res.sendStatus(201)

  } else {
    res.statusMessage = 'Invalid Input';
    res.status(400).end();
  }
})

saveEnergyApp.get('/products', (req, res) => {
  const simdayProductHeader = parseInt(String(req.headers['simulated-day']));
  const productsWithSimulated = products.filter((product) => {
    //console.log("lastSimulatedDay:", lastSimulatedDay)
    return product.simulatedday <= simdayProductHeader && product.stock !== 0
  })
  const clonedProducts = productsWithSimulated.map((Item) => {
    const {simulatedday, ...details } = Item;
    return details
  })
  res.send(clonedProducts)
})

saveEnergyApp.get('/products/:productId',(req,res) => {
  const simdayProductHeader = parseInt(String(req.headers['simulated-day']));
  const productsWithId = products.filter((product) => {
    return product.id === req.params.productId && product.simulatedday <= simdayProductHeader && product.stock !== 0
  })

  //console.log(productsWithId)
  if (!Empty(productsWithId)) {
    res.send(productsWithId);
  } else {
    res.statusMessage = 'Not found',
    res.sendStatus(404).end()
  }
})

interface interest {
  lastrate?:number,
  currentrate: number,
  effectfrom: number
}

const Interest:interest = { currentrate: 0.00, effectfrom : 0}

const calculateInterest = (lastSimulatedDay:number) => {
  const noOfDaysWithNewRate = lastSimulatedDay - Interest.effectfrom;
  //console.log("No Of Days with new rate: ",noOfDaysWithNewRate)
  if((noOfDaysWithNewRate) < period) {
    Accounts.forEach((account,index) => {
      const interestOnSavings = (noOfDaysWithNewRate/30 * account.balance * Interest.currentrate * 30/365) + ((30 - noOfDaysWithNewRate)/30* account.balance * Interest.lastrate * 30/365);
      Accounts[index].balance += interestOnSavings;
      Accounts[index].interest = interestOnSavings;
      //console.log("Interest calculated with parts: ",interestOnSavings)
      //console.log("With parts:", account.balance, noOfDaysWithNewRate, Interest.lastrate, Interest.currentrate)
    })
  } else {
    Accounts.forEach((account,index) => {
      const interestOnSavings = account.balance * Interest.currentrate * 30/365;
      //console.log("Interest calculated with current rate: ",interestOnSavings)
      //console.log("Normal :", account.balance, noOfDaysWithNewRate,Interest.currentrate)
      Accounts[index].balance += interestOnSavings;
      Accounts[index].interest = interestOnSavings;
    })

  }
}

saveEnergyApp.post('/interest', (req, res) => {
  const simdayInterestHeader = parseInt(String(req.headers['simulated-day']));
  if(!Empty(req.body)) {
    Interest.lastrate = Interest.currentrate,
    Interest.currentrate = req.body.interest,
    Interest.effectfrom = simdayInterestHeader
    res.sendStatus(200)

  } else {
    res.statusMessage = 'Invalid Input';
    res.status(400).end();
  }
})

saveEnergyApp.listen(port, host, () => {
  console.log(`[ ready ] http://${host}:${port}`);
});

// res.status(200).send(`Hello World', ${Date.now()}`);
// npx nodemon app.js
// npx tsc --watch