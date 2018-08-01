import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';
import { SplashScreen } from '@ionic-native/splash-screen';
import { StatusBar } from '@ionic-native/status-bar';
import { Keyboard } from '@ionic-native/keyboard';
import { UniqueDeviceID } from '@ionic-native/unique-device-id';
import { Geolocation } from '@ionic-native/geolocation';
import { DatePicker } from '@ionic-native/date-picker';
import { Camera } from '@ionic-native/camera';
// for translation
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

// custom services
import { MemoryService } from '../services/memory.service';
import { CacheMemoryService } from '../services/cache.memory.service';
import { TodosService } from '../services/todos.service';
import { OTPService } from '../services/otp.service';
import { LoginService } from '../services/login.service';
import { CreateRequestService } from '../services/create-request.service';
import { RequestHeaderService } from '../services/request.header.service';

import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MyApp } from './app.component';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    MyApp
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    IonicModule.forRoot(MyApp,{
      // for fixing the scroll issue on focussing form inputs
      scrollAssist: false,
      autoFocusAssist: false,
      scrollPadding: false
    }),
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp
  ],
  providers: [
    StatusBar,
    SplashScreen,
    Keyboard,
    UniqueDeviceID,
    Geolocation,
    DatePicker,
    Camera,
    MemoryService,
    CacheMemoryService,
    TodosService,
    OTPService,
    LoginService,
    CreateRequestService,
    RequestHeaderService,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
