// client-side js
// run by the browser each time your view template is loaded

function beginLoad(){
    $('.outputLabel').hide();
    $('.output').hide();
    $('.loadingImg').hide()
  
    var fileName = $('#imgFile')[0].files[0].name;
    // console.log(`filename: ${fileName}`);
    var fileExt = fileName.substr(fileName.lastIndexOf('.') + 1).toLowerCase();
    var validFiles = ["png", "jpg", "jpeg", "bmp"];
    if (validFiles.includes(fileExt)){
        $('.loadingImg').fadeIn().promise().done(function(){
            uploadImage();
        });
    }else{
      window.alert("Please upload a bitmap image (png, jpg, bmp)");
      $('#imgFile').val('');
    }
}

function uploadImage(){  
  
    var formData = new FormData();
    formData.append('file', $('#imgFile')[0].files[0]);
    
    // run potrace on image
     $.ajax({
            type: 'POST',
            url: '/potraceImg',
            data: formData,
            contentType: false,
            processData: false,
            async: false,
            cache: false,
            success: function(data){
              console.log('received AJAX response');
              console.log(data);
              $('.loadingImg').fadeOut();
              
              $('#potraceOutput .full .container').html(data.full);
              $('#potraceOutput .cut .container').html(data.cut);
              $('#potraceOutput .score .container').html(data.score);
              $('#potraceOutput .score .container').append(data.cleaned);
              $('#potraceOutput .compiled .container').html(data.compiled);
              
              $('.outputLabel').fadeIn('slow');
              $('.output').fadeIn('slow');
              $('#potraceOutput').fadeIn('slow');              
          }
        });
    
  
}