

/**
 * 1. after successfully login : generate a jwt token
 * npm i jsonwebtoken cookie-parser
 * jwt.sign(payload, secret ,{expireIn:"1d"})
 * 
 * 2. send token (generate in the server side) to the client side
 * store jwt token : (local Storage -> easier, HTTP-only cookie -> best way )
 * 
 * 3. for secure or sensitive or private or protected apis : send token to the server side
 * 
 * on the server side :
 * app.use(cors({
   origin:['http://localhost:5173'],
   credentials:true
 }));
 *  
 in the client side :
  use axios get,delete, patch for secure apis and must use :
  {withCredentials:true}
 * 4. validate the token in the server side :
 * if valid: provide the data
 * if not valid: logout
 * 
 */