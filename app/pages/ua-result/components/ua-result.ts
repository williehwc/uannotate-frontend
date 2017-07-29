import {Component} from '@angular/core';
import {Router, ROUTER_DIRECTIVES, RouteSegment} from '@angular/router';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
	moduleId: module.id,
	selector: 'ua-result',
	templateUrl: 'ua-result.html',
  directives: [[ROUTER_DIRECTIVES]]
})

export class ResultComponent {
  result: any = null;

  constructor (private _router: Router, private _http: Http) {}

  routerOnActivate(curr: RouteSegment) {
    let scope = this;
    if (curr.getParam('id')) {
      let loadedResult = function (data: any) {
        scope.result = data;
      };
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'annotationID': curr.getParam('id'),
      });
      scope._http.post(globals.backendURL + '/restricted/annotation/student/result', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => loadedResult(data),
          err => console.log(err),
          () => console.log('Got result')
        );
    }
  }

  gotoDashboard() {
    this._router.navigate(['/dashboard', '/home']);
  }

  gotoComparator() {
    this._router.navigate(['/dashboard', '/comparator']);
  }

}
