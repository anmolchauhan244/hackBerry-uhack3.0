"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.database();
const { dialogflow, Image, SimpleResponse, BasicCard, Button, Suggestions, BrowseCarousel, BrowseCarouselItem, MediaObject, Table, SignIn } = require('actions-on-google');
const app = dialogflow({
    debug: true
});
//some important variables which i used globally later.
let medicine;
let suggestions;
let date; 
let disp = [];


//This part decides what should be the welcome response.
app.intent("Default Welcome Intent", conv => {
    //This give user some suggestion chips
    suggestions = ['Any remiender','First aid during burn', 'symptoms of dengue', 'add avil on 1 may 2019'];
    //conv.ask used to display output.
    conv.ask("Hi! I am your personal doctor. I can tell you what first aid you should give in case of an accident or i can remind you to take medicine on time. I can tell you about symptoms of perticular disease.")
    conv.ask(new Suggestions(suggestions));
});


//This part is used to add medicine and its expiery date which personal doctor can remind him before expiry date.
app.intent("addMedicine", conv => {
    suggestions = ['First aid after burn', 'symptoms of yellow fever', 'symptoms of maleria','symptoms of typhoid'];
    medicine = (conv.parameters['medicine']);
    date = (conv.parameters['date']);
    if(date.length >= 1){
        db.ref("user/").set({
        "medicine": medicine,
        "date": date
        });
        conv.ask(`Okay your medicine ${medicine} is added. what you like to do next`);    
        conv.ask(new Suggestions(suggestions));    
    } 
    else {
        conv.ask('When will it expire? Like 25 december 2018.');
    }
});


//This part is used to fetch any remainder. Like any medicine which is going to expire etc...
app.intent('fetch', conv => {
        suggestions = ['Quit', 'add avil Expire 1 july 2018', 'symptoms of dengue'];
        return db.ref('user').once("value", snapshot => {
        const data = snapshot.val();
        if (data){
            conv.ask(`Your ${data["medicine"]} is going to expine on ${data["date"]}`);
            conv.ask(new Suggestions(['Quit', 'symptoms of maleria', 'first aid of stains']));
        }
        else{
            //if there isn't any remainder.
            conv.ask(`currently there isn't any remiender.`);
            conv.ask(new Suggestions(suggestions));
        }
    });
});


//expiry date added to remainder if dosen't already described.
app.intent("addMedicine - custom", conv => {
    date = (conv.parameters['date']);    
    db.ref("user/").set({
        "medicine": medicine,
        "date": date
    });
    conv.close(`Okay your medicine ${medicine} is added. I will remind you when its going to expire.`);  

});


//This part tells about symptoms of different diseases.
app.intent('symptom', conv =>{
    const disease = (conv.parameters['Symptoms']);
    suggestions = ["Quit", "symptoms of Dengue", "symptoms of maleria", "symptoms of pneumonia", "symptoms of typhoid", "symptoms of yellow fever"]
    return db.ref("Symptoms").once("value", snapshot => {
        const data = snapshot.val();
        let symptom = data[String(disease)];
        for(let i = 0;i<symptom.length;i++){
            disp[i] = symptom[i];
        }
        conv.ask(new SimpleResponse({
            speech: `According to appolo hospital, the symptoms of ${disease} are ${disp.toString()}`,
            text: 'Here it is!'
          }));
        conv.ask(new BasicCard({
            text: `The symptoms of ${disease} are ${disp.toString()}`,
            title: `Symptoms of ${disease}`,
          }));
        conv.ask(new Suggestions(suggestions))
    });
});

//this part gets user parameters and give reply accordingly
app.intent("firstAid", conv => {
    const category = (conv.parameters['accidents']);
    suggestions = ['animal bite', 'Cuts', 'Insect Stings', 'Minor Burns', 'Nosebleed', 'Sunburn', 'quit'];
    return db.ref("firstaid").once("value", snapshot => {
        const data = snapshot.val();
        // Create a basic card
        conv.ask(new SimpleResponse({
            speech: `${data[category]["say"]}`,
            text: 'Please refer doctor also'
          }));
        //rich response is used here
        conv.ask(new BasicCard({
    text: `${data[category]["text"]}`,
    subtitle: `${data[category]["subheading"]}`,
    title: `${data[category]["title"]}`,
    buttons: new Button({
      title: `Click here for more info about ${data[category]["title"]}`,
      url: `${data[category]["url"]}`,
    }),
    image: new Image({
      url: `${data[category]["image"]}`,
      alt: `${data[category]["alt"]}`,
    }),
    display: 'DEFAULT',
  }));
conv.ask(new Suggestions(suggestions));        
        
    });
});


exports.googleAction = functions.https.onRequest(app);