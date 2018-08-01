import { Component } from '@angular/core';
import { IonicPage, Events, ModalController, Modal, LoadingController, Loading } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CacheMemoryService } from '../../services/cache.memory.service';
import { MemoryService } from '../../services/memory.service';
import { LoginService } from '../../services/login.service';
import { VALIDATION_CONFIG } from '../../app/app.validation';
import { Geolocation } from '@ionic-native/geolocation';

@IonicPage()
@Component({
  selector: 'page-register',
  templateUrl: 'register.html',
})
export class Register {
  loading : Loading;
  regModal : Modal;
  selectedMap : string = "CURRENT";
  regObj : RegisterInterface;
  registerFormGroup: FormGroup;
  language : string;
  setRegisterObj : Function;
  type : string = 'password';
  constructor(private events : Events, 
    private formBuilder: FormBuilder,
    private cacheMemoryService : CacheMemoryService,
    private loginService: LoginService,
    private memoryService : MemoryService,
    private loadingCtrl: LoadingController,
    public geolocation: Geolocation,
    private modalCtrl: ModalController,) {
      // initialize object
      this.setRegisterObj = () => {
        this.regObj = {
            user_name : "",
            user_email : "",
            user_ph : "",
            user_password : "",
            confirm_password : "",
            longitude: "",
            latitude: "" 
        }
      }
      this.setRegisterObj();
      this.language = this.cacheMemoryService.get("language");
  }

    presentLoading() {
        this.loading = this.loadingCtrl.create({
        content: 'Loading ...'
        });
        this.loading.present();
    }

    hideLoading() {
        if(this.loading) this.loading.dismiss()
    }

    ionViewDidLeave() {
      console.log("leaving");
      this.hideLoading();
    }

    viewLocation(){
      if (this.selectedMap === "CURRENT") {
        this.presentRegModal('MapModal', {isDraggable:false});
      } else {
        this.presentRegModal('MapModal', {isDraggable:true});
      }

    }

    openMap(val) {
      this.selectedMap = val;
      if(val === "MAP"){
        this.presentRegModal('MapModal', {isDraggable:true});
      }
    }

    resetMemory() {
      this.memoryService.updateLocalMemory('latLng', {});
    }

  //called after the constructor and called  after the first ngOnChanges() 
  ngOnInit(){
    // for validation
    this.registerFormGroup = this.formBuilder.group(
      {
        username: ['', Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(20),
          Validators.pattern(VALIDATION_CONFIG.name)
          ])],
        email: ['', Validators.compose([
          Validators.required,
          Validators.minLength(4),
          Validators.maxLength(20),
          Validators.pattern(VALIDATION_CONFIG.email)
          ])],
        gsm: ['', Validators.compose([
          Validators.required,
          Validators.minLength(8),
          Validators.maxLength(10),
          Validators.pattern(VALIDATION_CONFIG.gsm)
          ])],
        password: ['', Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(12),
          ])],
        confirmPassword: ['', Validators.compose([
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(12),
          ])]
      }
    );
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Register');
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


    presentRegModal(modal, data) {
      this.regModal = this.modalCtrl.create(modal, {data: data});
      this.regModal.onDidDismiss(res => {
        if(res) {
          switch(res.modal) {
            case 'MAP': {
              if(res.latLng.lat) {
                this.regObj.latitude = res.latLng.lat.toString();
                this.regObj.longitude = res.latLng.lng.toString();
              }
              console.log(this.regObj);
              break;
            }
          }

        }
      });
      this.regModal.present();
    }

    ionViewWillLeave() {
      if(this.regModal) this.regModal.dismiss();
      this.resetMemory();
    }

  // post api call
  onRegisterSubmit() {
    /*
      In this project we need to set requestHeader object as a property to the postObj.
      So we set the postObject first and on resolving that promise, we call the post api.
      Note that, this promise never gets rejected as per our framework
    */
    let postObj = {
      logdet : {
        "user_name" : this.regObj.user_name,
        "user_email" : this.regObj.user_email,
        "user_ph" : this.regObj.user_ph,
        "user_password" : this.regObj.user_password,
        "latitude" : this.regObj.latitude,
        "longitude" : this.regObj.longitude
      }
    }
    this.loginService.setPostData(postObj).then(()=>{
      // the api is called only after the setPostData promise is resolved 
      this.loginService.customPsuedoSubscribe('registerObservable').subscribe((data)=>{
        this.registerFormGroup.reset();
        this.setRegisterObj();
        if(data[0].StatusCode === 0) {
          this.cacheMemoryService.set('sessionID', data[1].session_id)
          setTimeout(() => {
            this.openPage('ConfirmOTPPage');
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

interface RegisterInterface {
    "user_name" : string,
    "user_email" : string,
    "user_ph" : string,
    "user_password" : string,
    "confirm_password" : string,
    "longitude": string,
    "latitude": string 
}
