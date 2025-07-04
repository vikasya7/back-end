const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err))
    }
}

// highe order function so yu don,t need to manually write try catch in evry block of code

export{asyncHandler}




// const asyncHandler=(fn)=> async (req,res,next)=>{
//     try{
//         await fn(req,res,next)

//     } catch (error){
//         res.status(error.code || 500).json({
//             success:false,
//             message:error.message
//         })
//     }
// } // highr  oder function