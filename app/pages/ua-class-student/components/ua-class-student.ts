import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-class-student',
	templateUrl: 'ua-class-student.html',
  directives: [[ROUTER_DIRECTIVES]]
})


export class ClassStudentComponent {
  classe: any;
  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    let finishGetClass = function(data: any) {
      scope.classe = data;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'classID': parseInt(curr.getParam('id'))
    });
    this._http.post(globals.backendURL + '/restricted/class/view', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishGetClass(data),
        err => this._router.navigate(['/dashboard', '/home']),
        () => console.log('Got class')
      );
  }
  constructor( private _router: Router, private _http: Http ) { }
}
