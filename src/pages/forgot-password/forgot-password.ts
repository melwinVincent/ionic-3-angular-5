import { Component } from '@angular/core';
import { IonicPage, Events } from 'ionic-angular';
import { CacheMemoryService } from '../../services/cache.memory.service';
/**
 * Generated class for the ForgotPassword page.
 *
 * See https://ionicframework.com/docs/components/#navigation for more info on
 * Ionic pages and navigation.
 */
@IonicPage()
@Component({
  selector: 'page-forgot-password',
  templateUrl: 'forgot-password.html',
})
export class ForgotPassword {
  language : string;
  constructor(private events : Events, private cacheMemoryService : CacheMemoryService) {
    this.language = this.cacheMemoryService.get("language");
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ForgotPassword');
  }
  // for language change
  changeLanguage(lang) {
    this.language = lang;
    this.events.publish('language:change', lang);
  }

}
