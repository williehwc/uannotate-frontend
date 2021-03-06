import {Component, HostListener} from '@angular/core';
import {Router, ROUTER_DIRECTIVES } from '@angular/router';
declare var jQuery: any;
import {DROPDOWN_DIRECTIVES, AlertComponent} from 'ng2-bootstrap/ng2-bootstrap';
import {Http} from '@angular/http';
import globals = require('../../../globals');
import 'rxjs/Rx';

@Component({
  moduleId: module.id,
	selector: 'ua-phenository',
	templateUrl: 'ua-phenository.html',
  directives: [[AlertComponent, ROUTER_DIRECTIVES, DROPDOWN_DIRECTIVES]]
})


export class PhenositoryComponent {
  filter: string;
  offset: number = 0;
  to: number;
  total: number;
  following: boolean;
  followingOnly: boolean = false;
  diseases: Array<Object> = [];
  diseaseOfTheDay: string;
  diseaseName: string = null;
  diseaseOfTheDayDB: string = 'omim';
  diseaseNameDB: string = 'omim';
  noDiseaseOfTheDay: boolean = false;
  prefillAvailable: boolean = true;
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
      } else {
        scope.noDiseaseOfTheDay = true;
      }
      if (localStorage.getItem('uaPhenositoryDisease') !== null && localStorage.getItem('uaPhenositoryDiseaseDB') !== null) {
        scope.diseaseName = localStorage.getItem('uaPhenositoryDisease');
        scope.diseaseNameDB = localStorage.getItem('uaPhenositoryDiseaseDB');
      }
      scope.checkFollowing();
      scope.listDiseaseAnnotations();
      scope.newAnnotationPrecheck();
    };
    this._http.get(globals.backendURL + '/solr/omim/' + ((now.getFullYear() - 2000) * dayOfTheYear), globals.options) //ORPHA TODO
      .map(res => res.json())
      .subscribe(
        data => gotDiseaseOfTheDay(data),
        err => console.log(err),
        () => console.log('Got disease of the day')
      );
    // List diseases
    if (localStorage.getItem('uaPhenositoryFilter') !== null)
      this.filter = localStorage.getItem('uaPhenositoryFilter');
    if (localStorage.getItem('uaPhenositoryOffset') !== null)
      this.offset = +localStorage.getItem('uaPhenositoryOffset');
    if (localStorage.getItem('uaPhenositoryFollowing') !== null)
      this.followingOnly = true;
    this.listDiseases();
  }
  listDiseases() {
    let scope = this;
    localStorage.setItem('uaPhenositoryFilter', this.filter);
    localStorage.setItem('uaPhenositoryOffset', '' + this.offset);
    if (this.followingOnly) {
      localStorage.setItem('uaPhenositoryFollowing', '1');
    } else {
      localStorage.removeItem('uaPhenositoryFollowing');
    }
    let gotDiseases = function(data:any) {
      scope.diseases = data.diseases;
      scope.total = data.totalDiseases;
      scope.to = scope.offset + data.diseases.length;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'filter': this.filter,
      'offset': this.offset,
      'limit': 10,
      'following': this.followingOnly
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/diseases', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotDiseases(data),
        err => console.log(err),
        () => console.log('Got diseases')
      );
  }
  gotoFirst() {
    this.offset = 0;
    this.listDiseases();
  }
  gotoPrevious() {
    if (this.offset - 10 >= 0) {
      this.offset -= 10;
      this.listDiseases();
    }
  }
  gotoNext() {
    if (this.offset + 10 < this.total) {
      this.offset += 10;
      this.listDiseases();
    }
  }
  gotoLast() {
    while (this.offset + 10 < this.total)
      this.offset += 10;
    this.listDiseases();
  }
  setFollowing(follow: boolean) {
    this.followingOnly = follow;
    this.listDiseases();
  }
  setDisease(setDiseaseName: string, setDiseaseNameDB: string) {
    localStorage.setItem('uaPhenositoryDisease', setDiseaseName);
    localStorage.setItem('uaPhenositoryDiseaseDB', setDiseaseNameDB);
    this._router.navigate(['/dashboard', '/phenository-reload']);
  }
  newAnnotationPrecheck() {
    let scope = this;
    let finishPrecheck = function (data:any) {
      scope.prefillAvailable = data.prefillAvailable;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'diseaseName': this.diseaseName.substr(0, this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.diseaseNameDB
    });
    this._http.post(globals.backendURL + '/restricted/annotations/new-annotation-precheck', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => finishPrecheck(data),
        err => console.log(err),
        () => console.log('Created annotation')
      );
  }
  listDiseaseAnnotations() {
    let gotAnnotations = function (data:any) {
      let tableBody = '';
      for (let i = 0; i < data.annotations.length; i++) {
        tableBody += '<tr style="cursor: pointer" onclick="localStorage.setItem(\'uaAnnotationTemp\',\'' +
          data.annotations[i].annotationID + '\')">';
        tableBody += '<td>' + data.annotations[i].annotationID + '</td>';
        tableBody += '<td>' + ((data.annotations[i].cloneOf) ? data.annotations[i].cloneOf : '–' ) + '</td>';
        tableBody += '<td>' + data.annotations[i].author;
        if (data.annotations[i].authorAdmin) {
          tableBody += ' <i class="fa fa-shield" title="Phenotate administrator"></i>';
        } else if (data.annotations[i].authorProf) {
          tableBody += ' <i class="fa fa-user-md" title="Expert annotator"></i>';
        }
        tableBody += '</td>';
        tableBody += '<td>' + data.annotations[i].numClones + '</td>';
        tableBody += '<td>' + data.annotations[i].numLikes + '</td>';
        tableBody += '<td>' + data.annotations[i].date + '</td>';
        tableBody += '</tr>';
      }
      jQuery('#table-body-annotations').html(tableBody);
      jQuery('#table-annotations').DataTable({
        'language': {
          'emptyTable': 'There are no annotations for this disease.<br />Be the first to make one!',
        },
        'dom': 'ltipr'
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
    if (this.diseaseNameDB === 'omim') {
      window.open(globals.omimURL + this.diseaseName.substr(0,
        this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    } else if (this.diseaseNameDB === 'ordo') {
      window.open(globals.ordoURL + this.diseaseName.substr(0,
        this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''), '_blank');
    }
  }
  createAnnotation(startFromScratch: boolean, publishTemporarily: boolean) {
    let scope = this;
    this.alerts = [];
    let diseaseName = this.diseaseName;
    let finishCreateAnnotation = function (data:any) {
      if (data.success) {
        scope._router.navigate(['/dashboard', '/in-progress', data.annotationID]);
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
        'vocabulary': this.diseaseNameDB,
        'startFromScratch': startFromScratch,
        'publishTemporarily': publishTemporarily
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
  checkFollowing() {
    let scope = this;
    let gotFollowing = function (data:any) {
      scope.following = data.following;
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.diseaseName.substr(0,
        this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.diseaseNameDB
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/following', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotFollowing(data),
        err => console.log(err),
        () => console.log('Got following')
      );
  }
  toggleFollow() {
    let scope = this;
    let gotFollowing = function (data:any) {
      scope.following = data.following;
      scope.listDiseases();
    };
    let body = JSON.stringify({
      'token': localStorage.getItem('uaToken'),
      'dbDisease': this.diseaseName.substr(0,
        this.diseaseName.indexOf(' ')).replace(/[^0-9]/g, ''),
      'vocabulary': this.diseaseNameDB,
      'follow': !this.following
    });
    this._http.post(globals.backendURL + '/restricted/phenository/prof/follow', body, globals.options)
      .map(res => res.json())
      .subscribe(
        data => gotFollowing(data),
        err => console.log(err),
        () => console.log('Got following')
      );
  }
  search() {
    localStorage.setItem('uaSearch', 'true');
    localStorage.removeItem('uaMyAnnotationsDisease');
    this._router.navigate(['/dashboard', '/my-annotations']);
  }
  @HostListener('document:click') onMouseEnter() {
    if (localStorage.getItem('uaAnnotationTemp')) {
      let id = localStorage.getItem('uaAnnotationTemp');
      localStorage.removeItem('uaAnnotationTemp');
      this._router.navigate(['/dashboard', '/in-progress', id]);
    }
  }
}
