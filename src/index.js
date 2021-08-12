const tf = require('@tensorflow/tfjs');

const express = require("express")
const path = require('path')
const cors = require('cors')
const lem = require('lemmatizer');
var natural = require('natural');
const functions = require("firebase-functions")
var tokenizer = new natural.WordTokenizer();
var pickle = require('pickle/lib/pickle');
// let words = ["'s", 'abdomen', 'adios', 'age', 'and', 'ankle', 'anytime', 'apart', 'are', 'base', 'big', 'birthday', 'blood', 'born', 'buttock', 'bye', 'called', 'cya', 'do', 'doing', 'firm', 'flat', 'foot', 'for', 'g2g', 'hang', 'headache', 'heel', 'hello', 'hi', 'how', 'improves', 'insomnia', 'is', 'knee', 'low', 'mountain', 'name', 'old', 'out', 'plan', 'pose', 'posture', 'pressure', 'reduces', 'relief', 'sciatica', 'see', 'slightly', 'some', 'stand', 'strengthens', 'tadasana', 'there', 'thigh', 'this', 'time', 'to', 'toe', 'touching', 'up', 'wa', 'want', 'week', 'weekend', 'what', 'whats', 'when', 'who', 'with', 'ya', 'yoga', 'you', 'your']
// let labels = ['age', 'date', 'default', 'goodbye', 'greeting', 'name', 'yoga_tadasana']

//version 1.1 with new model    
let words = ["'s", '12', 'abdomen', 'abdominal', 'acidity', 'adho', 'adios', 'after', 'age', 'and', 'ankle', 'anxiety', 'apart', 'are', 'arm', 'arthritis', 'asana', 'ashtanga', 'ashwa', 'asthma', 'back', 'backache', 'backbending', 'base', 'bend', 'bending', 'bhujangasana', 'big', 'birthday', 'blood', 'body', 'born', 'bow', 'breath', 'burn', 'buttock', 'bye', 'called', 'calm', 'calorie', 'cardiovascular', 'chakrasana', 'chest', 'circulation', 'cobra', 'column', 'comfortably', 'concentration', 'constipation', 'cord', 'crescent', 'crocodile', 'cya', 'dandasana', 'day', 'decrease', 'deepens', 'depression', 'dharurasana', 'diabetes', 'diamond', 'digestion', 'disorder', 'do', 'dog', 'doing', 'down', 'downward', 'eight', 'ejuvenate', 'energetic', 'equestrian', 'facing', 'fat', 'firm', 'flat', 'flatulence', 'flexibility', 'flexible', 'foot', 'for', 'forward', 'from', 'g2g', 'gas', 'gastritis', 'halasana', 'half', 'hang', 'hastapadasana', 'hastauttanasana', 'headache', 'heart', 'heel', 'hello', 'hi', 'hip', 'hip-width', 'how', 'immunity', 'improves', 'in', 'indigestion', 'inguinal', 'insomnia', 'is', 'joint', 'keeping', 'knee', 'kneeling', 'left', 'leg', 'lie', 'loss', 'low', 'lower', 'lung', 'makrasana', 'memory', 'menstrual', 'meory', 'mind', 'moon', 'mountain', 'mukha', 'muscle', 'namaskara', 'name', 'nervous', 'obesity', 'of', 'old', 'on', 'opener', 'or', 'organ', 'other', 'out', 'oxygen', 'pain', 'part', 'place', 'plan', 'plow', 'point', 'pose', 'posture', 'power', 'pranamasana', 'prayer', 'pressure', 'problem', 'rabbit', 'raise', 'raised', 'recline', 'reclining', 'reduce', 'reduces', 'region', 'relaxation', 'relaxes', 'relaxing', 'released', 'relief', 'relieving', 'salute', 'sanchalanasana', 'sasankasana', 'sciatica', 'see', 'shavasana', 'shoulder', 'slightly', 'some', 'spinal', 'spine', 'spirit', 'stable', 'stand', 'standing', 'stick', 'stiffness', 'stimulates', 'stomach', 'straight', 'strength', 'strengthens', 'stress', 'stretch', 'stretched', 'suryanamaskara', 'svanasana', 'system', 'tadasana', 'the', 'there', 'thigh', 'this', 'thoracic', 'thorax', 'throat', 'thunderbolt', 'time', 'to', 'toe', 'touching', 'triangle', 'trikonasana', 'trunk', 'twist', 'up', 'urdva', 'urinary', 'use', 'utthita', 'vajrasana', 'vakrasana', 'vertebra', 'vertebral', 'wa', 'want', 'week', 'weekend', 'weight', 'what', 'whats', 'when', 'who', 'with', 'ya', 'yoga', 'you', 'your'];
let labels = ['age', 'date', 'goodbye', 'greeting', 'name', 'yoga_bhujangasana', 'yoga_dhanurasana', 'yoga_halasana', 'yoga_makrasana', 'yoga_sasankasana', 'yoga_shavasana', 'yoga_suryanamaskar', 'yoga_tadasana', 'yoga_trikonasana', 'yoga_vajrasana', 'yoga_vakrasana'];

var json_Data = require('../public/data.json');
const { floor } = require('@tensorflow/tfjs');

const fs = require('fs');
const app = express()
app.use(express.static("public"))

app.use(cors);

app.get("/",(req,res)=>{
    res.sendFile("index.html")
});
app.get("/msg/(:msg)",(req,res)=>{
   
    let msg = decodeURI(req.params.msg);
    let msgs = pred_class(msg,words,labels);
    function clean_text(text)
    {
        let token =tokenizer.tokenize(text)
        
        let tokens= []
        token.forEach(element => {
            tokens.push(natural.PorterStemmer.stem(element));
        });
        return tokens;
    }
    function bag_of_words(text,words) {
        let tokens = clean_text(text)
        let bow = [];
        for(let i=0;i<words.length;i++)
        {
            bow[i] = 0;
        }
        for(let w=0;w<words.length;w++)
        {
            for(let i=0;i<tokens.length;i++)
            {
                if((words[w].localeCompare(tokens[i]))==0)
                {
                    bow[w] = 1;
                }
            }
        }
        return bow;        
    }
    function pred_class(text, words, labels)
    {
        let bow = bag_of_words(text, words);
        console.log(bow);
        let model = tf.loadLayersModel("/models/model%20(2).json");
        let Final_Datas = [];
        let data = model.then(
        (res)=>{
            
            //convert bow to tensor2d size 1,74
            let data = tf.tensor2d([bow])
            //predict the o/p
            let reslt =  res.predict(data);
            let thresh = 0.3;
            let final_reslt = []
            //result arr would be in reslt.dataSync()
            for(let k=0;k<reslt.dataSync().length;k++)
            {
                if(reslt.dataSync()[k]>thresh)
                {
                    final_reslt.push(k)
                    final_reslt.push(reslt.dataSync()[k]);
                }
            }
            let final_intent = [];
            let Final_Datas = [];
            //getting result index
            for(let r=0;r<final_reslt.length;r=r+2)
            {
                final_intent.push(final_reslt[r]);

            }
            function printResult(data,index,i) {
                let cnt = Math.floor(Math.random()*(data[i]['responses'].length));
                if(cnt == undefined)
                {
                    Final_Datas.push("We will record message for future refrences\n");
                }
                Final_Datas.push(data[i]['responses'][cnt]);
            }
            //getting intents tag matching with labels and getting index to print result
            for(let i=0;i<labels.length;i++)
            {
                for(let j=0;j<final_intent.length;j++)
                {  
                    if((json_Data['intents'][i]['tag'].localeCompare(labels[final_intent[j]])) == 0)
                        printResult(json_Data['intents'],labels[final_intent[0]],i)
                    
                }
            }
            return Final_Datas;
        }).catch((err)=>{return err});
        
        data.then((data)=>{console.log("Is "+data);res.send(JSON.stringify(data))});
        
    }
    
    

});
app.get("/data",(req,res)=>{
    res.send("It works ....")
})
app.listen(3000,()=>{
    console.log("Running on 3000");
})
