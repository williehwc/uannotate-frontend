import {Component} from '@angular/core';

@Component({
  moduleId: module.id,
	selector: 'ua-help-prof',
	templateUrl: 'ua-help-prof.html'
})


export class HelpProfComponent {
  phenotateEmail: string = 'support-phenotate.org'.replace('-', '@');
}
