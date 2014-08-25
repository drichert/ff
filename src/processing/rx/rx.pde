import processing.serial.*;



Serial port;

int numFreqs  = 200;
int ndxOffset = 100; 

int[] ndxs   = new int[numFreqs];
float[] vals = new float[numFreqs];

// ASCII Line Feed
int lf = 10;

String[] lines;
String[] words;

PrintWriter textOutput;

void setup() {
  size(400, 400);
  background(255);
  stroke(30);
  frameRate(2);
  
  port = new Serial(this, Serial.list()[0], 115200);
  port.clear();
  
  lines       = loadStrings("trees.txt");
  String text = join(lines, " ");
  words       = split(text, " ");
  
  textOutput = createWriter("trees-maple.txt");
}

void draw() {
  // Index for popluating ndxs (frequency indexes) 
  // and vals (sensor data)
  int _ndx = 0;
    
  while(port.available() > 0) {
    String buffer = port.readStringUntil(lf);
   
    if(buffer != null) {
      String[] bufferVals = split(buffer, ",");
      
      for(int i = 0; i < bufferVals.length; i++) {
        if(match(bufferVals[i], "^[0-9.]+$") != null) {
          if(i % 2 == 0) {
            _ndx = i / 2;
          
            ndxs[_ndx] = int(bufferVals[i]);
          }
          else {
            vals[_ndx] = Float.parseFloat(bufferVals[i]);
          }
        }
      }
    }
  }
  
  background(255);  
  
  /*
  float[] uniqVals = filterDuplicates(vals);
  printArray(uniqVals);
  */
  
  // A line of words for output
  //String[] _words = new String[uniqVals.length];
  String[] _words = new String[vals.length];
  
  /*
  for(int i = 0; i < uniqVals.length; i++) {
    int wordsNdx = int(float(words.length) * uniqVals[i]);
    _words[i] = words[wordsNdx];
  }
  println(_words);
  */
  
  for(int i = 0; i < numFreqs; i++) {
    int x = width / numFreqs * ndxs[i];
    //float y = vals[i];
    float y = height * vals[i];
    
    //point(width / numFreqs * ndxs[i], vals[i]);
    line(x, 0, x, y);
        
    //int wordsNdx = int(float(words.length) * vals[i]);
    // TODO: Add index offset paramter (potentiometer controlled?)
    int wordsNdx = int(vals[i] + ndxOffset) % words.length;
    _words[i] = words[wordsNdx];
  }
  printArray(_words);
  textOutput.println(join(_words, " "));
  //printArray(vals);
}


void keyPressed() {
  textOutput.flush();
  textOutput.close();
  exit();
}


// Not working 
float[] filterDuplicates(float[] arr) {
  float[] out = new float[0];
  
  for(int i = 0; i < arr.length; i++) {
    boolean found = false;
    
    for(int j = 0; j < out.length && !found; j++) {
      if(arr[i] == out[j]) found = true;
    }
    
    if(!found) append(out, arr[i]);
  }
  
  return out;
}


