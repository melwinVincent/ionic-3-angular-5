import { Component } from '@angular/core';
import { NavController,IonicPage, Events } from 'ionic-angular';
import { CacheMemoryService } from '../../services/cache.memory.service';
@IonicPage()
@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {
  language : string;
  tab1Root = 'CreateRequest';
  tab2Root = 'MyRequests';
  reqLabel = 'Create Request';
  constructor(public navCtrl: NavController, private events: Events, private cacheMemoryService : CacheMemoryService) {
    this.language = this.cacheMemoryService.get("language");
      events.subscribe('update:home-label', (label) => {
        this.reqLabel = label;
      });
  }

  // for publishing the events
  openPage(page) {
    this.events.publish('page:push', page);
  }

  // for language change
  changeLanguage(lang) {
    this.language = lang;
    this.events.publish('language:change', lang);
  }

  logout() {
    this.cacheMemoryService.setJSON("loginResponse", {});
    this.navCtrl.setRoot('LoginPage');
  }
}
