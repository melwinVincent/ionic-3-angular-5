import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { ServiceModal } from './service-modal';
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    ServiceModal,
  ],
  imports: [
    IonicPageModule.forChild(ServiceModal),
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
})
export class ServiceModalModule {}
