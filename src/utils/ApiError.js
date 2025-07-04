class ApiError extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        error=[],
        statck=""
        
    ){
        super(message). // calls the constructor of the base error class
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=error


        if(statck){
            this.stack=statck
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}