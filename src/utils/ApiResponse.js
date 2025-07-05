class ApiResponse{
    constructor(statusCode, data,message="success"){
      this.statusCode=statusCode
      this.data=data
      this.message=message
      this.success=statusCode<400
    }
}

export {ApiResponse}
// When you build APIs without something like ApiResponse, your routes may return responses in different structures:


