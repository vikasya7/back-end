class ApiError extends Error{
    constructor(
        statusCode,
        message="something went wrong",
        error=[],
        stack=""
        
    ){
        super(message)  // calls the constructor of the base error class && message overwrite
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=error


        if(stack){
            this.stack=stack
        }else{
            Error.captureStackTrace(this,this.constructor)
        }
    }
}
export {ApiError}