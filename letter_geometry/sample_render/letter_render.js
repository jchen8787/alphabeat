var gl;
var program;
var index_buffer;
var canvas;

var vertex_buffer;

window.onload = function init()
{
    //set up input
    window.addEventListener("keydown",check_key,true);

    canvas = document.getElementById( "gl-canvas" );
   
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    //
    //  Configure WebGL
    //
    gl.viewport( 0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight );
    gl.clearColor( 0.0, 0.0, 0.0, 1.0 );

    //  Load shaders and initialize attribute buffers    
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    // Associate out shader variables with our data buffer
    var vPosition = gl.getAttribLocation( program, "vPosition" );

    // bind the GPU buffer for the verticies
    vertex_buffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vertex_buffer);

    //bind shader variables for vertex position and transformation
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    vtransform=gl.getUniformLocation( program, "vtransform" );

    //set the viewport matrix
    viewport=mat4();

    //set the projection matrix
    var aspect=canvas.width/canvas.height;
    projection=perspective(90,aspect,1,90);
    
    //set the camera matrix
    var camera=mat4();
    camera=mult(camera,translate(0.7,0,-1.3));
    camera=mult(rotate(30,vec3(0,1,0)),camera);

    var transform_matrix=mat4();
    transform_matrix=mult(transform_matrix,viewport);
    transform_matrix=mult(transform_matrix,projection);
    transform_matrix=mult(transform_matrix,camera);
    gl.uniformMatrix4fv(vtransform,false,flatten(transform_matrix));

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
};

function check_key(e) {
    if(e.keyCode>=65 && e.keyCode<=90) {
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry_verticies[e.keyCode-65]), gl.STATIC_DRAW);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays( gl.TRIANGLES, 0, geometry_verticies[e.keyCode-65].length);
    }
    else if(e.keyCode>=48 && e.keyCode<=57) {
	gl.bufferData(gl.ARRAY_BUFFER, flatten(geometry_verticies[26+e.keyCode-48]), gl.STATIC_DRAW);
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.drawArrays( gl.TRIANGLES, 0, geometry_verticies[26+e.keyCode-48].length);
    }
    else
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
