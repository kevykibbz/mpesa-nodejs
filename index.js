const admin=require("firebase-admin");
const cors=require("cors");
const express=require("express");
require("dotenv").config();

const parentCollectionName=process.env.PARENTCOLLECTIONNAME;
const childCollectionName=process.env.CHILDCOLLECTIONNAME;
const callBackUrl=process.env.CALLBACK || "/";
const port=process.env.PORT || 80;


const app=express();
app.listen(port,()=>{
    console.log("Sever started...");
});

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cors());


var serviceAccount=require("./keys/serviceAccount.json");
admin.initializeApp({credential:admin.credential.cert(serviceAccount)});

app.get("/",(req,res)=>{
    res.send("Server is working.");
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
    return res.json("data received successfully");
});