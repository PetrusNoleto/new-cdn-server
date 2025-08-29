import StartServer from "./main";
import serverConfig from "./config/server.config";


function startServerInstance (){
    try{
        const {host,port,address} = serverConfig
        if(host && port && address){
            StartServer(host,Number(port))
        }else{
            throw new Error("server not started verify envirioment variables SERVER_PORT/SERVER_HOST/SERVER_ADDRESS/ is declared")
        }
    }
    catch(error){
        console.error(error)
    }
}
startServerInstance()