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
    const responseCode=callbackData.ResultCode;
    const mCheckoutRequestID=callbackData.CheckoutRequestID;
    if(responseCode === 0)
    {
        const details=callbackData.CallbackMetadata.Item;

        const mAmountPaid=details[0].Value;
        const mReceipt=details[1].Value;
        const transactionDate=details[2].Value
        const mPhonePaidFrom=details[3].Value;


        const mEntryDetails={
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
                    .update(mEntryDetails)
                    .then((value)=>{
                        console.log("data updated successfully");
                    })
                    .catch((e)=>{
                        console.log(`error:${e}`);
                    });
                }
            })
            .catch((e)=>{
                console.log(`error:${e}`);
            });
        return res.json("ok");
    }else{
        return res.json("ok");
    }
});