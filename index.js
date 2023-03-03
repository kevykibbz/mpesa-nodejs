const admin=require("firebase-admin");
const axios = require('axios');
const request=require("request");
const cors=require("cors");
const express=require("express");
require("dotenv").config();

const childCollectionName=process.env.CHILDCOLLECTIONNAME;
const consumerKey=process.env.CONSUMERKEY;
const consumerSecret=process.env.CONSUMERSECRET;
const shortCode=process.env.SHORTCODE;
const confirmationUrl=process.env.CONFIRMATIONURL;
const validationUrl=process.env.VALIDATIONURL;
const port=process.env.PORT || 80;


const app=express();
app.listen(port,(err,live)=>{
    if(err){
        console.error(err);
    }
    console.info("Sever started...");
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());


var serviceAccount=require("./keys/serviceAccount.json");
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});

/*testing the server*/
app.get("/", async(req,res)=>{
    res.send("Server is working.");
});

/*get the access token*/
const generateToken=async(req,res,next)=>{
    let url="https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    let auth=`Basic ${new Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64")}`
    await axios.get(url,{
        headers:{
            "Content-Type":"application/json",
            "Authorization":auth
        }
    })
    .then((response)=>{
        res.locals.access_token=response.data.access_token
        next()
    })
    .catch((error)=>{
        console.log(error)
    })

}




app.get("/register/url",generateToken,async(req,res)=>{
    let access_token=res.locals.access_token
    const url= 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl'
    const auth = `Bearer ${access_token}`
    const data={'ShortCode':shortCode,'ResponseType': 'Completed','ConfirmationURL':confirmationUrl,'ValidationURL': validationUrl}
    request.post(
        {
            url:url,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': auth
            },
            json:data
        },
        (error,response,body)=>{
            if(error){
                console.error(error)
            }else{
                res.status(200).json(body)
            }
        }
    )
});




app.post("/",async(req,res)=>{
    const callbackData=req.body.Body.stkCallback;
    const resultCode=callbackData.ResultCode;
    const mCheckoutRequestID=callbackData.CheckoutRequestID;
    const metaData=callbackData.CallbackMetadata;
    var mAmountPaid=mReceipt=transactionDate=mPhonePaidFrom="";
    
    if(metaData !=undefined)
    {
        //success request 
        const details=metaData.Item;
        mAmountPaid=details[0].Value;
        mReceipt=details[1].Value;
        transactionDate=details[2].Value
        mPhonePaidFrom=details[3].Value;
       
    }

    const mEntryDetails={
        "ResultCode":resultCode,
        "Receipt":mReceipt,
        "Phone":mPhonePaidFrom,
        "Amount":mAmountPaid,
        "Date Completed":transactionDate,
        "Status":"Completed",
    };
    await admin.firestore()
        .collection(childCollectionName)
        .doc(mCheckoutRequestID)
        .get()
        .then(async(value)=>{
            if(value.exists){
                await admin.firestore()
                .collection(childCollectionName)
                .doc(mCheckoutRequestID)
                .update(mEntryDetails);
            }
        })
        .catch((e)=>{
            console.log(`error:${e}`);
        });
    return res.json("Data received successfully.");
});