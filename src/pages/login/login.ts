import { Component } from '@angular/core';
import { IonicPage, Events } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CacheMemoryService } from '../../services/cache.memory.service';
import { LoginService } from '../../services/login.service';
import { VALIDATION_CONFIG } from '../../app/app.validation';
@IonicPage()
@Component({
  selector: 'login-page',
  templateUrl: 'login.html',
})
export class LoginPage {
  // interface is defined below the class
  loginObj : LoginInterface;
  loginFormGroup: FormGroup;
  language : string;
  setLoginObj : Function;
  type : string = 'password';
  
  constructor(
    private events : Events, 
    private formBuilder: FormBuilder,
    private cacheMemoryService : CacheMemoryService,
    private loginService: LoginService) {
      // initialize object
      this.setLoginObj = () => {
        this.loginObj = {
          Username : "",
          Password : ""
        }
      }
      
      this.setLoginObj();
      this.language = this.cacheMemoryService.get("language");
  
  }

  //called after the constructor and called  after the first ngOnChanges() 
  ngOnInit(){
    // for validation
    this.loginFormGroup = this.formBuilder.group(
      {
        gsm: ['', Validators.compose([
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(8),
          Validators.pattern(VALIDATION_CONFIG.gsm)
          ])],
        password: ['', Validators.compose([
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          ])]
      }
    );
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad GenerateOTPPage');
  }

  // for language change
  changeLanguage(lang) {
    this.language = lang;
    this.events.publish('language:change', lang);
  }
  // for toasting
  toast(msg:string) {
    this.events.publish('toast', msg);
  }

  // for publishing the events
  openPage(page) {
    this.events.publish('page:push', page);
  }

  // post api call
  onLoginSubmit() {
    /*
      In this project we need to set requestHeader object as a property to the postObj.
      So we set the postObject first and on resolving that promise, we call the post api.
      Note that, this promise never gets rejected as per our framework
    */
    let postObj = {
      logdet : this.loginObj
    }
    this.loginService.setPostData(postObj).then(()=>{
      // the api is called only after the setPostData promise is resolved 
      this.loginService.customPsuedoSubscribe('loginObservable').subscribe((data)=>{
        this.loginFormGroup.reset();
        this.setLoginObj();
        if(data[0].StatusCode === 0) {
          this.cacheMemoryService.setJSON('loginResponse', data[1]);
          this.cacheMemoryService.set('sessionID', data[1].session_id);
          setTimeout(() => {
            this.openPage('HomePage');
          }, 250); // for better UX
          
        } else {
          this.toast(data[0].StatusDesc);
        }
      
      },(data)=>{
        // remove the refernce string from memory
        this.toast("Couldn't connect");
      });
      
    },(error)=>{
      // this promise never gets rejected as per our framework
      this.toast(error);
      console.log("setPostData rejected", error);
    });

  }

  changeType = () => {
    this.type = this.type === 'password' ? 'text' : 'password';
  }
  
}

interface LoginInterface {
	"Username":string,
  "Password":string
}

