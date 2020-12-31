(function uptextv() {
  try{
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "http://localhost/bundle.js";
      var head = document.getElementsByTagName('head')[0];
      if (!head) return;
      head.appendChild(script);            
  }catch(e){
      console.log('UPTEXTV : Error ->'+e)
  }
})()
