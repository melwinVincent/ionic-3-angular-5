import { NgModule } from '@angular/core';
import { IonicPageModule } from 'ionic-angular';
import { CreateRequest } from './create-request';
import { TranslateModule, TranslateLoader} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient } from '@angular/common/http';
import { SharedModule } from '../../app/app.shared.module';
export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
@NgModule({
  declarations: [
    CreateRequest,
  ],
  imports: [
    IonicPageModule.forChild(CreateRequest),
    SharedModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: createTranslateLoader,
        deps: [HttpClient]
      }
    })
  ],
})
export class CreateRequestModule {}
