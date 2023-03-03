const request=require("request");
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

