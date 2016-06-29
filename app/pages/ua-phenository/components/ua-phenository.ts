import {Component, HostListener} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
declare var jQuery: any;
import {AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-phenository',
	templateUrl: 'ua-phenository.html',
  directives: [[AlertComponent, ROUTER_DIRECTIVES]]
})


export class PhenositoryComponent {
  diseaseOfTheDay: string;
  diseaseName: string;
  diseaseOfTheDayDB: string = 'omim';
  diseaseNameDB: string = 'omim'; // ORPHA TODO
  alerts: Array<Object> = [];
  constructor( private _router: Router, private _http: Http) {
    let scope = this;
    // Disease of the day (formula for query: (year - 2000) * day of the year)
    let now:any = new Date();
    let start:any = new Date(now.getFullYear(), 0, 0);
    let dayOfTheYear = Math.floor((now - start) / 86400000);
    let gotDiseaseOfTheDay = function (data:any) {
      if (data.matches.length > 0) {
        scope.diseaseOfTheDay = data.matches[0];
        scope.diseaseName = scope.diseaseOfTheDay;
        scope.listDiseaseAnnotations();
      }
    };
    this._http.get(globals.backendURL + '/solr/omim/' + ((now.getFullYear() - 2000) * dayOfTheYear), globals.options) //ORPHA TODO
      .map(res => res.json())
      .subscribe(
        data => gotDiseaseOfTheDay(data),
        err => console.log(err),
        () => console.log('Got disease of the day')
      );
  }
  listDiseaseAnnotations() {
    let gotAnnotations = function (data:any) {
      let tableBody = '';
      for (let i = 0; i < data.annotations.length; i++) {
        tableBody += '<tr style="cursor: pointer" onclick="localStorage.setItem(\'uaAnnotation\',\'' +
          data.annotations[i].annotationID + '\')">';
        tableBody += '<td>' + data.annotations[i].annotationID + '</td>';
        tableBody += '<td>' + ((data.annotations[i].cloneOf) ? data.annotations[i].cloneOf : '–' ) + '</td>';
        tableBody += '<td>' + data.annotations[i].author + '</td>';
        tableBody += '<td>' + data.annotations[i].numClones + '</td>';
        tableBody += '<td>' + data.annotations[i].numLikes + '</td>';
        tableBody += '<td>' + data.annotations[i].date + '</td>';
        tableBody += '</tr>';
      }
      jQuery('#table-body-disease').html(tableBody);
      jQuery('#table-annotations').DataTable({
        'language': {
          'emptyTable': 'There are no annotations for this disease.<br />Be the first to make one!'
        }
      });
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.diseaseName.substr(0, this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.diseaseNameDB
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/annotations', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotAnnotations(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  lookUpDisease() {
    window.open(globals.omimURL + this.diseaseName.substr(0,
        this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
  }
  createAnnotation() {
    let scope = this;
    this.alerts = [];
    let diseaseName = this.diseaseName;
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress/' + data.annotationID]);
      } else {
        scope.alerts.push({
          type: 'danger',
          msg: 'Invalid disease',
          closable: true
        });
        scope.diseaseName = diseaseName;
      }
    };
    if (this.diseaseName !== null) {
      this.diseaseName = '';
      // Create new annotation
      let body = JSON.stringify({
        'token': localStorage.getItem('uaToken'),
        'diseaseName': diseaseName,
        'vocabulary': 'omim' //ORPHA TODO
      });
      this._http.post(globals.backendURL + '/restricted/annotations/prof/new-annotation', body, globals.options)
        .map(res => res.json())
        .subscribe(
          data => finishCreateAnnotation(data),
          err => console.log(err),
          () => console.log('Created annotation')
        );
    }
  }
  @HostListener('document:click') onMouseEnter() {
    let annotationID = localStorage.getItem('uaAnnotation');
    if (annotationID) {
      localStorage.removeItem('uaAnnotation');
      this._router.navigate(['/dashboard', '/in-progress/' + annotationID]);
    }
  }
}
