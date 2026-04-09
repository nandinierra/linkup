
import jwt from "jsonwebtoken";


export  function verifyToken(req, res, next){
   const Token= req.cookies.jwt_token;
   // console.log("Token",  Token)
   if(!Token){
      return res.status(401).json({
         message:"Unauthorized"
      })}
   try{
        const decoded=  jwt.verify(Token, process.env.SECRETCODE);
        req.user=decoded;
       next();


     }catch(err){
          return res.status(401).json({
            message:"Invalid Token"
          })
     }



   }
