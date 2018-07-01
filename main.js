//Check if service worker is available
if(navigator.serviceWorker){
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('service worker registered'))
    .catch(() => console.log('An error occured and service worker is not registered'))
}


//Todays Date function
const todaysDate = ()=>{
  const today = new Date().toString().split(' ').splice(1, 3).join(' ');
  const todays = document.querySelector('.todaysDate');
  todays.innerText = today;
}

//Clear-input fields
const clear = () => {
  const clearBtn = document.querySelector('.clear')
  const result = document.querySelector('.result');
  const amount = document.querySelector('.amount');
  clearBtn.addEventListener('click', function(){
    result.value = "";
    amount.value = "";
  })
}

//event listeners
const addEvents = () => {
  const calculate = document.querySelector('.calculate');
  calculate.addEventListener('click', () => {
    const amount = document.querySelector('.amount').value;
    if(amount != ""){
      getExchangeRate();
    }
  });
  clear(); 
}


//Instantiate IndexedDb database
const dbPromise = idb.open('currency-converter', 1, (upgradeDb) => {
  const keyval = upgradeDb.createObjectStore('countries', {keyPath: 'id'});
  const rates = upgradeDb.createObjectStore('rates');
})

// append option tag to the select tag
const fillSelect = (countryList) => {
  const inputSelector = document.querySelector('#inputSelector');
  const outputSelector = document.querySelector('#outputSelector');
  countryList.map(function(country){
    let fillSelector = 
              `<option value="${country.currencyId}">
              ${country.name}, ${country.currencyId}
              </option>`;
            inputSelector.innerHTML += fillSelector;
            outputSelector.innerHTML += fillSelector;
   })
}

// fetch list of countries from the API
const getCountries = () => {
  
  fetch("https://free.currencyconverterapi.com/api/v5/countries")
    .then(response => response.json())
    .then(data => {
     const countries = data.results;
     const countriesArray = Object.values(countries);
     
     fillSelect(countriesArray);
    
     // Save countries list into IndexedDB
    dbPromise
      .then(db => {
        if(!db) return;
        const tx = db.transaction('countries', 'readwrite');
        const store = tx.objectStore('countries');
        countriesArray.forEach(function(country){
          store.put(country);
        })
        
      })
    })
    .catch(() => {
      // when offline, serve the countries and currency to the page
      dbPromise
        .then(db => {
          if(!db) return;
          const tx = db.transaction('countries');
          const store = tx.objectStore('countries');
          store.getAll().then((countries) => {
            if(countries.length > 0){
              fillSelect(countries);
            }
          })
        })
    })
}

// fetch exchange rate for a currency pair

const getExchangeRate = () =>{
  const inputCurrency = inputSelector.value;
  const outputCurrency = outputSelector.value;
  let exchangeRate;
  const amount = document.querySelector('.amount').value;
  const converting = document.querySelector('.converting');
  const url_conversion = `https://free.currencyconverterapi.com/api/v5/convert?q=${inputCurrency}_${outputCurrency}&compact=ultra`;
  converting.style.display = 'block';
  fetch(url_conversion)
    .then(response => response.json())
    .then(data => {
      for(const d in data){
        exchangeRate = data[d];
        convert(exchangeRate, amount);
        converting.style.display = 'none';
      }
      // save the exchange rate obtained to IndexedDB
      dbPromise
        .then(db => {
          if(!db) return;
          const tx = db.transaction('rates', 'readwrite');
          const store = tx.objectStore('rates');
          for (const d in data){
            store.put(data, `${inputCurrency}_${outputCurrency}`);
          }
        })
    })
    .catch(() => {
      // When offline, retrieve saved exchange rates
      dbPromise
      .then(db => {
        if(!db) return;
        const tx = db.transaction('rates');
        const store = tx.objectStore('rates');
            
        store.get( `${inputCurrency}_${outputCurrency}`)
          .then((value) => {
            exchangeRate = value[`${inputCurrency}_${outputCurrency}`];
            convert(exchangeRate, amount);
            converting.style.display = 'none';
          })              
      })
    })
}

// convert to the required currency
const convert = (exchangeRate, amount) =>{
  
  const result = document.querySelector('.result');
  let convertedAmount = exchangeRate * amount;
  result.value = convertedAmount.toFixed(2);
}

if(!navigator.onLine){
  const warning = document.querySelector('.warning');
  warning.style.display = 'flex';
  dbPromise
    .then(db => {
      if(!db) return;
      const tx = db.transaction('rates');
      const store = tx.objectStore('rates');
          
      store.getAll()
        .then((rates) => {
          rates.forEach(rate => {
            for(a in rate){
              const li = document.createElement('li');
              const list = document.querySelector('.list');
              
              li.appendChild(document.createTextNode(a));
              list.style.display = 'flex';
              list.appendChild(li);
            }
          })
        })              
    })
}


// after the page loads
document.addEventListener('DOMContentLoaded', () => {
  todaysDate();
  addEvents();
  getCountries();
});