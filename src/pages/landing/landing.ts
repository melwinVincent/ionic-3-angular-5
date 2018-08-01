import { Component } from '@angular/core';
import { NavController, NavParams, IonicPage, Events} from 'ionic-angular';
@IonicPage()
@Component({
  selector: 'page-landing',
  templateUrl: 'landing.html',
})
export class LandingPage {
  constructor(public navCtrl: NavController, public navParams: NavParams, private events : Events) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Landing');
  }
  // for language change
  changeLanguage(lang) {
    this.events.publish('language:change', lang);
    this.events.publish('page:push', 'LoginPage');
  }

}
