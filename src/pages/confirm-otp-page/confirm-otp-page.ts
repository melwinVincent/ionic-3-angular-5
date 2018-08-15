import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage, Events } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CacheMemoryService } from '../../services/cache.memory.service';
import { OTPService } from '../../services/otp.service';
import { VALIDATION_CONFIG } from '../../app/app.validation';

@IonicPage()
@Component({
  selector: 'page-confirm-otp-page',
  templateUrl: 'confirm-otp-page.html',
})
export class ConfirmOTPPage {
  // interface is defined below the class
  otp : number;
  confirmOTPFormGroup: FormGroup;
  language : string;
  counter : number = 0;
  resendInterval : number = 20;
  
  constructor(
    public navCtrl: NavController, 
    public navParams: NavParams, 
    private events : Events, 
    private formBuilder: FormBuilder,
    private cacheMemoryService : CacheMemoryService,
    private otpService: OTPService) {

    this.language = this.cacheMemoryService.get("language");
  
  }

  //called after the constructor and called  after the first ngOnChanges() 
  ngOnInit(){
    // for validation
    this.confirmOTPFormGroup = this.formBuilder.group({
        otp: ['', Validators.compose([
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(4),
          Validators.pattern(VALIDATION_CONFIG.gsm)
          ])]
    });
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad confirmOTPPage');
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
  onconfirmOTPFormSubmit() {
    /*
      In this project we need to set requestHeader object as a property to the postObj.
      So we set the postObject first and on resolving that promise, we call the post api.
      Note that, this promise never gets rejected as per our framework
    */
    let postObj = {
      "session_id": this.cacheMemoryService.get('sessionID'),
      "OTP": this.otp,
    }
    this.otpService.setPostData(postObj).then(()=>{
      // the api is called only after the setPostData promise is resolved 
      this.otpService.customPsuedoSubscribe('confirmOTPObservable').subscribe((data)=>{
        this.confirmOTPFormGroup.reset();
        if(data[0].StatusCode === 0) {
          this.cacheMemoryService.set('sessionID', data[1].session_id)
          setTimeout(() => {
            this.openPage('LoginPage');
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

   // post api call
  onResendOTPSubmit() {
    /*
      In this project we need to set requestHeader object as a property to the postObj.
      So we set the postObject first and on resolving that promise, we call the post api.
      Note that, this promise never gets rejected as per our framework
    */
    let postObj = {
      "session_id": this.cacheMemoryService.get('sessionID'),
    }
    this.otpService.setPostData(postObj).then(()=>{
      // the api is called only after the setPostData promise is resolved 
      this.otpService.customPsuedoSubscribe('resendOTPObservable').subscribe((data)=>{
        this.confirmOTPFormGroup.reset();
        if(data[0].StatusCode === 0) {
          this.counter = this.resendInterval;
          let interval = setInterval(()=> {
            this.counter--
            if(this.counter === 0) clearInterval(interval);
          },1000)
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

}
