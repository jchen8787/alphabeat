var canvas, gl, program;
var vPosition, vNormal;
var vTexCoord;
var colorLoc, modelMatrixLoc, projectionMatrixLoc;

var eye = vec3(0,0,3), at = vec3(0,0,0), up = vec3(0,1,0); //view
var fovy = 90, aspect; const near = 1, far = 5000; //projection
var leftO = -3.0, rightO = 3.0, ytopO =3.0, bottomO = -3.0, nearO = -10, farO = 10; //orthographic
var camera, projection, orthoMatrix;

var drawIn3D = true;

var curTime, lastTime, elapsed=0;
var beatOffset=0, lastOffset=0;
var cityOffset=0, lastCityOffset=0;
var beatLock = false;

var blueMM, greenMM, redMM;
var greenBool = false, redBool = false;
var sphereMM;


var sun_light_coordinates = vec4(5000,5000,1000,1);
var sunAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var sunDiffuse = vec4( 1, 1, 0.8, 1.0 );
var sunSpecular = vec4( 1.0, 1.0, 0.3, 1.0 );

var cityMM;
var cityAmbientProduct = mult(sunAmbient, vec4(0.3, 0.0, 0.3, 1.0));
var cityDiffuseProduct = mult(sunDiffuse, vec4(1,1,1,1));
var citySpecularProduct = mult(sunSpecular, vec4(1,0.8,0,1));
var cityShininess = 25.0;

var letterDiffuseProduct = mult(sunDiffuse, vec4(1,1,1,1));
var letterSpecularProduct = mult(sunSpecular, vec4(1,0.8,0.5,1));
var letterShininess = 25.0;

var platformAmbientProduct = mult(sunAmbient, vec4(0.7, 0.7, 0, 1.0));
var platformDiffuseProduct = mult(sunDiffuse, vec4(1,1,1,1));
var platformSpecularProduct = mult(sunSpecular, vec4(1,0.8,0.5,1));
var platformShininess = 25.0;

var index;
var digitMM;
var yOff;
var charCode;

var score, streak, bonus;
var word_progress = [];

var charDisplayLimit = 21;
var letterArray = "abcdefghijklmnopqrstuvyxyz";
var lettersOnScreen = [];

var city_buffer;
var skybox_buffer;
var city_normal_buffer;
var letter_buffer;
var letter_normal_buffer;
var outline_buffer;
var triangle_buffer;
var platform_buffer;
var platform_normal_buffer;

// Shadows
var light;
var m;



//texture coordinates for full-size texture
var skybox_texCoord = [
    vec2(0, 0),
    vec2(0, 1),
    vec2(1, 1),
    vec2(1, 0)
];

//cube geometry
var skybox_verticies = [
    vec4( -1, -1,  1, 1.0 ),
    vec4( -1,  1,  1, 1.0 ),
    vec4( 1,  1,  1, 1.0 ),
    vec4( 1, -1,  1, 1.0 ),
    vec4( -1, -1, -1, 1.0 ),
    vec4( -1,  1, -1, 1.0 ),
    vec4( 1,  1, -1, 1.0 ),
    vec4( 1, -1, -1, 1.0 )
];

var skybox_pointsArray=[];
var skybox_texCoordsArray=[];

function quad(a, b, c, d) {
    
    skybox_pointsArray.push(skybox_verticies[a]); 
    skybox_texCoordsArray.push(skybox_texCoord[0]);

    skybox_pointsArray.push(skybox_verticies[b]); 
    skybox_texCoordsArray.push(skybox_texCoord[1]); 

    skybox_pointsArray.push(skybox_verticies[c]); 
    skybox_texCoordsArray.push(skybox_texCoord[2]); 
   
    skybox_pointsArray.push(skybox_verticies[a]); 
    skybox_texCoordsArray.push(skybox_texCoord[0]); 

    skybox_pointsArray.push(skybox_verticies[c]); 
    skybox_texCoordsArray.push(skybox_texCoord[2]); 

    skybox_pointsArray.push(skybox_verticies[d]); 
    skybox_texCoordsArray.push(skybox_texCoord[3]);   
}


function colorCube()
{
    quad( 1, 0, 3, 2 );
    quad( 2, 3, 7, 6 );
    quad( 3, 0, 4, 7 );
    quad( 6, 5, 1, 2 );
    quad( 4, 5, 6, 7 );
    quad( 5, 4, 0, 1 );
}

//define outline geometry
var outline_verticies=[
    //top line
    vec3(-2.1,0.95,0),
    vec3(2.1,0.93,0),
    vec3(-2.1,0.93,0),
    vec3(2.1,0.95,0),
    vec3(2.1,0.93,0),
    vec3(-2.1,0.95,0),
    //bottom line
    vec3(-2.1,0.61,0),
    vec3(2.1,0.59,0),
    vec3(-2.1,0.59,0),
    vec3(2.1,0.61,0),
    vec3(2.1,0.59,0),
    vec3(-2.1,0.61,0),
    //left line
    vec3(-2.1,0.95,0),
    vec3(-2.1,0.59,0),
    vec3(-2.08,0.59,0),
    vec3(-2.1,0.95,0),
    vec3(-2.08,0.95,0),
    vec3(-2.08,0.59,0)
];

function makeTriangle() {
    var triangle = [];
    triangle.push(vec3(-0.5, 0.5, 0.0));
    triangle.push(vec3( 0.5, 0.5, 0.0));
    triangle.push(vec3( 0.0,-0.5, 0.0));
    return triangle;
}

function makeSphere(complexity) { //centered at origin
    function divideTriangle(a, b, c, count, sphere) {
	if ( count > 0 ) {
	    var ab = normalize(mix( a, b, 0.5), false);
	    var ac = normalize(mix( a, c, 0.5), false);
	    var bc = normalize(mix( b, c, 0.5), false);
	    divideTriangle( a, ab, ac, count - 1, sphere );
	    divideTriangle( ab, b, bc, count - 1, sphere );
	    divideTriangle( bc, c, ac, count - 1, sphere );
	    divideTriangle( ab, bc, ac, count - 1, sphere );
	} else { 
	    sphere.push(a); 
	    sphere.push(b); 
	    sphere.push(c); 
	    }
	}
    const a = vec3(0.0, 0.0, -1.0); 
    const b = vec3(0.0, 0.942809, 0.333333);
    const c = vec3(-0.816497, -0.471405, 0.333333);
    const d = vec3(0.816497, -0.471405, 0.333333);
    
    var sphere = [];
    divideTriangle(a, b, c, complexity, sphere);
    divideTriangle(d, c, b, complexity, sphere);
    divideTriangle(a, d, b, complexity, sphere);
    divideTriangle(a, c, d, complexity, sphere);
    return sphere;
}

function initObjects() {
    greenMM = mult( translate(0.8,0,0.5),scale2(.5,.5,.5) );
    redMM = mult( translate(-0.8,0,0.5),scale2(.5,.5,.5) );
    cityMM = translate(-1000,-20,200);
    platformMM = mult(translate(0.5,-2,-2),rotate(90,vec3(0,1,0)));
    platformMM = mult(platformMM,scale2(1,.5,1));
}

function setup() {
	canvas = document.getElementById( "gl-canvas" );
	gl = WebGLUtils.setupWebGL( canvas );
	if ( !gl ) { alert( "WebGL isn't available" ); }

	// Reset score on app initialization
	score = streak = 0;
	bonus = 1;

	gl.clearColor( 0, 0, 0, 1 );
	gl.enable(gl.DEPTH_TEST);
	gl.viewport( 0, 0, canvas.width, canvas.height );
	aspect = canvas.width/canvas.height;

	//load shaders
	program = initShaders( gl, "vertex-shader", "fragment-shader" );
	gl.useProgram( program );

	vPosition = gl.getAttribLocation( program, "vPosition" );
	vNormal = gl.getAttribLocation( program, "vNormal" );
    vTexCoord = gl.getAttribLocation( program, "vTexCoord" );
	// Associate out shader variables with our data buffer
	modelMatrixLoc = gl.getUniformLocation( program, "modelMatrix" );
	cameraMatrixLoc = gl.getUniformLocation( program, "cameraMatrix" );
	projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	rotationMatrixLoc = gl.getUniformLocation( program, "rotationMatrix" );
	colorLoc = gl.getUniformLocation( program, "color" );

    //load skybox data into GPU
    colorCube();
    skybox_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, skybox_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skybox_pointsArray), gl.STATIC_DRAW);

    //set up texture buffers for each texture
    tBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(skybox_texCoordsArray), gl.STATIC_DRAW );

    //load city data into GPU
    city_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, city_buffer); 
    gl.bufferData(gl.ARRAY_BUFFER, flatten(new_york_geometry_verticies[0]), gl.STATIC_DRAW);
    city_normal_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, city_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(new_york_geometry_normals[0]), gl.STATIC_DRAW);


    //load platform data into GPU
    platform_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, platform_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(platform_geometry_verticies[0]), gl.STATIC_DRAW);
    platform_normal_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, platform_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(platform_geometry_normals[0]), gl.STATIC_DRAW);

	//load all the letters into the gpu
	var letters = [];
	for (var i = 0; i<geometry_verticies.length ; i++) letters=letters.concat(geometry_verticies[i]);
	var letters_normal = [];
	for (var i = 0; i<geometry_normals.length ; i++) letters_normal=letters_normal.concat(geometry_normals[i]);

	letter_buffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, letter_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(letters), gl.STATIC_DRAW);
	letter_normal_buffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, letter_normal_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(letters_normal), gl.STATIC_DRAW);

	//load outline data into the gpu
	outline_buffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,outline_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, flatten(outline_verticies), gl.STATIC_DRAW);

	//load triangle data into gpu
	triangle_buffer=gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER,triangle_buffer);
	gl.bufferData( gl.ARRAY_BUFFER, flatten(makeTriangle()), gl.STATIC_DRAW );


    //load sphere data into gpu
    var sphereVertices = makeSphere(3);
    numSphereVertices = sphereVertices.length;
    sphere_buffer=gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER,sphere_buffer);
    gl.bufferData( gl.ARRAY_BUFFER, flatten(sphereVertices), gl.STATIC_DRAW );
	
    //setup textures
    configureTexture();
	
	determineCurrentLetter();
	lastTime = Date.now();
}

function setVPMatrix() {
	camera = lookAt(eye, at, up);
	projection = perspective( fovy, aspect, near, far );
	orthoMatrix = ortho(leftO, rightO, bottomO, ytopO, nearO, farO);
}

window.onload = function init() {
	initObjects();
	setup();
	setVPMatrix();
	document.onkeydown = handleKeyDown;
    render();
}

function getCharGeometryIndex(character) {
    var char_code=character.toUpperCase().charCodeAt(0);
    if(char_code>=65 && char_code<=90)
	return char_code-65;
    else if(char_code>=48 && char_code<=57)
	return 26+char_code-48;
    else
	throw "invalid character: "+char_code+' '+character;
}

function getLetterVerticiesIndex(arrayIndex) {
	var i = 0;
	for(var j = 0; j<arrayIndex; j++) i+=geometry_verticies[j].length;
	return i;
}

var texture1;

function configureTexture() {
    var image = document.getElementById("texImage1");
    texture1 = gl.createTexture();
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, 
         gl.RGB, gl.UNSIGNED_BYTE, image );
    //nearest neighbor
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, 
		      gl.NEAREST );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);

    gl.activeTexture( gl.TEXTURE0 );
    gl.bindTexture( gl.TEXTURE_2D, texture1 );
    gl.uniform1i(gl.getUniformLocation( program, "texture1"), 0);
}

var run_before=0;
var last_buffer;
var last_normals_buffer;
var last_modelMatrix;

function drawBuffer(buffer, normals_buffer, color, modelMatrix, starting_index, num_verticies, primitive) {

    if (drawIn3D) gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projection) );
    else gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(orthoMatrix) );

    gl.uniformMatrix4fv( cameraMatrixLoc, false, flatten(camera) );

    if(run_before==0 || last_buffer != buffer || last_normals_buffer != normals_buffer) {
	if(normals_buffer != null) { //light the model
	    //TODO: add support for multiple light sources
	    gl.uniform1i(gl.getUniformLocation(program,"shader_type"),1);
	    gl.bindBuffer(gl.ARRAY_BUFFER, normals_buffer);
	    gl.vertexAttribPointer( vNormal, 3, gl.FLOAT, false, 0, 0 );
	    gl.enableVertexAttribArray( vNormal);
	    
	    var modelViewMatrix = mult(camera,modelMatrix);    
	    var rotation_matrix = [	vec3(modelViewMatrix[0][0], modelViewMatrix[0][1], modelViewMatrix[0][2]),
					vec3(modelViewMatrix[1][0], modelViewMatrix[1][1], modelViewMatrix[1][2]),
					vec3(modelViewMatrix[2][0], modelViewMatrix[2][1], modelViewMatrix[2][2])];
	    gl.uniformMatrix3fv( rotationMatrixLoc, false, flatten(rotation_matrix));

	    if(buffer==city_buffer) {
		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(cityAmbientProduct) );
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(cityDiffuseProduct) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(citySpecularProduct) );	
		gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(sun_light_coordinates) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess"),cityShininess );
	    }
	    if(buffer==letter_buffer) {
		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(mult(sunAmbient, vec4(1,0,0,1)))); //todo: add more colors
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(letterDiffuseProduct) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(letterSpecularProduct) );	
		gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(sun_light_coordinates) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess"),letterShininess );
	    }
	    if(buffer==platform_buffer) {
		gl.uniform4fv( gl.getUniformLocation(program, "ambientProduct"),flatten(platformAmbientProduct) );
		gl.uniform4fv( gl.getUniformLocation(program, "diffuseProduct"),flatten(platformDiffuseProduct) );
		gl.uniform4fv( gl.getUniformLocation(program, "specularProduct"),flatten(platformSpecularProduct) );	
		gl.uniform4fv( gl.getUniformLocation(program, "lightPosition"),flatten(sun_light_coordinates) );
		gl.uniform1f( gl.getUniformLocation(program, "shininess"),platformShininess );
	    }
	}
	else {
	    gl.uniform1i(gl.getUniformLocation(program,"shader_type"),0);
	    gl.disableVertexAttribArray(vNormal);
	}

		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
		gl.enableVertexAttribArray( vPosition);
	}

    gl.uniformMatrix4fv( modelMatrixLoc, false, flatten(modelMatrix) );
    gl.uniform4fv( colorLoc, flatten(color) );

    gl.drawArrays( primitive, starting_index, num_verticies);

    //don't bind buffers twice if we don't need to
    run_before=1;
    last_buffer=buffer;
    last_normals_buffer=normals_buffer;
}

function drawBlueTri() { drawBuffer(triangle_buffer, null, vec4(0,0,1,1), blueMM, 0, 3, gl.TRIANGLES); }

function drawSphere() { 
    drawBuffer(sphere_buffer, null, vec4(0,0,1,1), sphereMM, 0, numSphereVertices, gl.LINE_LOOP);
};

function drawGreenTri() { drawBuffer(triangle_buffer, null, vec4(0,1,0,1), greenMM, 0, 3, gl.TRIANGLES); }
function drawRedTri() { drawBuffer(triangle_buffer, null, vec4(1,0,0,1), redMM, 0, 3, gl.TRIANGLES); }

function drawScore(textToWrite, xOffset, yOffset, zOffset, positionAtTop, colorVec) {
	for (var i = 0; i < textToWrite.length; i++) {
		if (textToWrite[i] == ' ') continue;

		index = getCharGeometryIndex(textToWrite[i].toLowerCase());

		charCode = textToWrite.charCodeAt(i);
		if (charCode >= 48 && charCode <= 57) {
			// adjust for number positioning
			if (positionAtTop) yOff = (yOffset - 0.05);
			else yOff = (yOffset - 0.14);
		}
		else yOff = yOffset;

		var charScale;
		var charSpacing;
		if (positionAtTop) {
			charScale = 0.2;
			charSpacing = 0.15;
		}
		else {
			charScale = 0.5;
			charSpacing = 0.4;
		}

		digitMM = mult(translate(xOffset + charSpacing * i, yOff, zOffset), scale2(charScale, charScale, charScale));
		drawBuffer(letter_buffer, null, colorVec, digitMM, getLetterVerticiesIndex(index), geometry_verticies[index].length, gl.TRIANGLES);
	}
}

function drawScoreText() {
	var scoreString  = "Score "  + score.toString();
	var bonusString  = "Bonus "  + bonus.toString() + "x";

	drawScore(scoreString,  -2.1, 1.1, 0, true, vec4(1,1,0,1));
	drawScore(bonusString,   0.9, 1.1, 0, true, vec4(1,0.3,0,1));

	if (streak > 1) {
		var streakString = "Streak " + streak.toString();
		drawScore(streakString, -1.4, -2.3, 1, false, vec4(1,0,1,1));
	}
}

function drawOutlines() {
    gl.disable(gl.DEPTH_TEST);
    drawBuffer(outline_buffer, null, vec4(1,1,1,1), mat4(), 0, outline_verticies.length-6, gl.TRIANGLES);
    //draw the spacers
    for(var i = 0; i<charDisplayLimit+1; i++) {
	drawBuffer(outline_buffer, null, vec4(1,1,1,1), translate(i*0.2,0,0), 12, 6, gl.TRIANGLES);
    }
    gl.enable(gl.DEPTH_TEST);
}

function drawSkybox() {
    gl.disable(gl.DEPTH_TEST);
    gl.uniform1i(gl.getUniformLocation(program,"shader_type"),2);
    
    //draw the skybox with texture
    gl.bindBuffer(gl.ARRAY_BUFFER, skybox_buffer);
    gl.vertexAttribPointer( vPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition);
    
    gl.bindBuffer( gl.ARRAY_BUFFER, tBuffer );
    gl.vertexAttribPointer( vTexCoord, 2, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vTexCoord );
    
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.drawArrays( gl.TRIANGLES, 0, skybox_pointsArray.length );
    
    gl.disableVertexAttribArray( vTexCoord );
    gl.enable(gl.DEPTH_TEST);

    run_before=0; //drawBuffer function needs to reload
}

function drawCity() {
    drawBuffer(city_buffer, city_normal_buffer, vec4(0.1,0.1,0.1,1), cityMM, 0, new_york_geometry_verticies[0].length, gl.TRIANGLES);
}

function drawWordProgress() {
    // print word progress with color
    for (var i = 0; i < word_progress.length; i++) {
		index = getCharGeometryIndex(word_progress[i]['letter']);

		letterMM = mat4();
		letterMM = mult( letterMM, translate(-1.98 + 0.2 * i, 0.76, 0));
		letterMM=mult(letterMM,sphereMM);
		letterMM = mult( letterMM, scale2(0.4, 0.4, 0.4) );

		var letterColor;
		if (word_progress[i]['correct']) letterColor = vec4(0,1,0,1);
		else letterColor = vec4(1,0,0,1)

		drawBuffer(letter_buffer, null, letterColor, letterMM, getLetterVerticiesIndex(index), geometry_verticies[index].length, gl.TRIANGLES);
    }
}

function dropLetter(letter) {
	var randomXPos = Math.random() * 6 - 3;
	lettersOnScreen.unshift({letter: letter, shadow: 0, xPos: randomXPos, yPos: 2});
}

var rotation_amount=0;
function drawFallingLetters() {
    for (var l = 0; l < lettersOnScreen.length; l++) {
		var currLetter = lettersOnScreen[l];
		
		if (currLetter['yPos'] <= -3) lettersOnScreen.pop();
		else {
			currLetter['yPos'] -= 0.06;
			index = getCharGeometryIndex(currLetter['letter']);
			currLetter['shadow'] += 0.006;
			
			letterMM =	mult(translate(currLetter['xPos'],currLetter['yPos'],0),
							mult(rotate(rotation_amount,vec3(0,1,0)), 
								scale2(0.4, 0.4, 0.4)));
			drawBuffer(letter_buffer, letter_normal_buffer, vec4(1,0,0,1), letterMM, getLetterVerticiesIndex(index), geometry_verticies[index].length, gl.TRIANGLES);

			// Shadows
			light = vec3(0.0, 3.0, 3.0);

		    m = mat4();
		    m[3][3] = 0;
		    m[3][1] = -1/light[1];

			letterMM = 	mult(translate(currLetter['xPos'], -1.7, -1+currLetter['shadow']*2.2),
							mult(rotate(rotation_amount,vec3(0,1,0)),
								scale2(currLetter['shadow'], currLetter['shadow'], currLetter['shadow'])));
		    letterMM = mult(letterMM, translate(light[0], light[1], light[2]));
		    letterMM = mult(letterMM, m);
		    letterMM = mult(letterMM, translate(-light[0], -light[1], -light[2]));

		    drawBuffer(letter_buffer, null, vec4(0.0, 0.0, 0.0, 1.0), letterMM, getLetterVerticiesIndex(index), geometry_verticies[index].length, gl.TRIANGLES);
		}
    }
    rotation_amount++;
}

function drawPlatform() {
    drawBuffer(platform_buffer, platform_normal_buffer, vec4(0.8,0.8,0.8,1), platformMM, 0, platform_geometry_verticies[0].length, gl.TRIANGLES);
}

function setSphereSize() {
    //beatOffset determines size of blue triangle
    var scaleFactor = 1 + (500-beatOffset)/500.0;
    sphereMM = scale2(scaleFactor,scaleFactor,scaleFactor);
    sphereMM = mult(sphereMM,scale2(0.5,0.5,0.5));
}

var curLetter;
var curLindex;
var curLMM = translate(0,1.5,0);
function determineCurrentLetter() {
	curLetter = letterArray[Math.floor(Math.random()*26)];
	curLindex = getCharGeometryIndex(curLetter);
}
function drawCurrentLetter() {
	drawBuffer(letter_buffer, null, vec4(0.3,1,0.7,1), curLMM, getLetterVerticiesIndex(curLindex), geometry_verticies[curLindex].length, gl.TRIANGLES);
}

var beatLMM = translate(0,0,2);
function drawBeatLetter() {
	drawBuffer(letter_buffer, null, vec4(1,.4,0,1), beatLMM, getLetterVerticiesIndex(acceptedLindex), geometry_verticies[acceptedLindex].length, gl.TRIANGLES);
}

function keepTime() {
	curTime = Date.now();
	elapsed += curTime - lastTime;
	lastTime = curTime;
	
	lastOffset = beatOffset;
	beatOffset = elapsed%500; //500ms per beat
	
	lastCityOffset = cityOffset;
	cityOffset = elapsed%45000; //city resets every 45 seconds
}

var render = function() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
    drawSkybox();
    
    //first handle things related to beat timing
    keepTime();
    setSphereSize();
	//reset city
	if(lastCityOffset>=44900 && cityOffset<=100) cityMM = translate(-1000,-20,200);
	//start of new beat
    if (lastOffset >=400 && beatOffset<=100) {
		determineCurrentLetter();
		drawBeatLetter()
		dropLetter(curLetter);
	}

    if (lastOffset<250 && beatOffset>=250) { //half way through the beat
		acceptedLindex = curLindex;
		if (greenBool==false && redBool==false) { //no input last beat
			//TODOwatdaf: show symbol for no input miss
			streak = 0;
			bonus = 1;
		}
		greenBool = false; //clear hit or miss symbol
		redBool = false;
		beatLock = false; //allow next input
    }

    //remove the falling letters that have fallen beneath the platform
    for(var i=0; i<lettersOnScreen.length; i++) {
	if(lettersOnScreen[i]['yPos']<-1.6) {
	    lettersOnScreen.splice(i,1);
	    i--;
	}
    }

    drawIn3D=true //3D object
    drawSphere();
    drawCity();
    drawFallingLetters();
    drawPlatform();

    drawIn3D = false; // switch to 2D objects
	drawCurrentLetter();
	drawScoreText();
	drawWordProgress();
	drawOutlines();

    if (greenBool) drawGreenTri();
    if (redBool) drawRedTri();
    
    
    //move the platform
    cityMM= mult(cityMM, translate(0,0,1));

    requestAnimFrame(render);
}

function updateScore(letter, success) {
	var letterPress;
	if (!greenBool) {
		// key wasn't pressed at the right time or wasn't pressed at all
		streak = 0;
		bonus = 1;
		// TODO: replace 'j' with whatever letter is correct this frame
		letterPress = {letter: 'j', correct: false};
	}
	else {
		// input was correct during this beat
		streak++;
		switch (streak) {
			case 2:
			case 4:
			case 8:
			case 16:
			case 32:
			case 64:
			case 128:
				bonus *= 2;
				break;
		}
		score += bonus;
		// TODO: replace 'j' with whatever letter is correct this frame
		letterPress = {letter: 'j', correct: true};
	}
    letterPress = {letter: letter, correct: success};
    
    //update letters falling to reflect press
    if(letterPress['correct']) {
	var matching_letter=-1;
	for(var i=0; i<lettersOnScreen.length; i++) {
	    //get the letter that matches character closest to ground
	    if(lettersOnScreen[i]['letter'].toUpperCase()==letterPress['letter'].toUpperCase()) {
		if(matching_letter!=-1) {
		    if(lettersOnScreen[i]['yPos']<lettersOnScreen[matching_letter]['yPos'])
			maching_letter=i;
		}
		else
		    matching_letter=i;
	    }
	}
	if(matching_letter!=-1)
	    lettersOnScreen.splice(matching_letter,1);
    }

	if (word_progress.length == charDisplayLimit) word_progress.shift();
	word_progress.push(letterPress);
}

var acceptedLindex;
function handleKeyDown(event) { 
    if(event.keyCode >= 65 && event.keyCode <= 90 && !beatLock) { //a-z
		var inputLindex = event.keyCode-65;
		//150ms margin of error
		if ((beatOffset<150||beatOffset>349)&&(acceptedLindex==inputLindex))
			greenBool = true;
		else redBool = true;
		var letter=String.fromCharCode(event.keyCode);
		updateScore(letter, greenBool);
		beatLock=true;
	}
	if (event.keyCode == 192) { //'`'
		var debugMsg = curLindex;
		alert(debugMsg);
	}
}
