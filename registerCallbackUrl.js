const admin=require("request");
const cors=require("cors");
const express=require("express");
require("dotenv").config();

const consumerKey=process.env.CONSUMERKEY;
const consumerSecret=process.env.CONSUMERSECRET;



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



app.get("/register/url",(req,response)=>{
    let url="https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    let auth=new Buffer(consumerKey+":"+consumerSecret).toString("base64")
    request(
        {
            url:url,
            header:{
                "Authorization":"Basic " + auth
            }
        },
        (error,response,body)=>{
            if(error){
                console.error(error)
            }else{
                response.status(200).json(body)
            }
        }
    )
});

