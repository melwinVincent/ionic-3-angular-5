import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[my-input]'
})

export class MyInputDirective {
    constructor(private elementRef : ElementRef){
    }
    @HostListener('ionFocus', ['$event']) ionFocus(event: any) {
        setTimeout(()=> {
            this.elementRef.nativeElement.closest('ion-item').classList.add('ttct-block-display');
        },250);
    }
    @HostListener('ionBlur', ['$event']) ionBlur(event: any) {
        setTimeout(()=> {
            this.elementRef.nativeElement.closest('ion-item').classList.remove('ttct-block-display');
        },250);
    }
}