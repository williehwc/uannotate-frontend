import {Component, ViewEncapsulation} from '@angular/core';
import { ROUTER_DIRECTIVES, Routes } from '@angular/router';

import {HomeComponent} from '../../../pages/ua-home/components/ua-home';
import {InProgressComponent} from '../../../pages/ua-in-progress/components/ua-in-progress';
import {MyAnnotationsComponent} from '../../../pages/ua-my-annotations/components/ua-my-annotations';
import {PhenositoryComponent} from '../../../pages/ua-phenository/components/ua-phenository';
import {ClassStudentComponent} from '../../../pages/ua-class-student/components/ua-class-student';
import {ClassProfComponent} from '../../../pages/ua-class-prof/components/ua-class-prof';
import {JoinClassComponent} from '../../../pages/ua-join-class/components/ua-join-class';
import {NewClassComponent} from '../../../pages/ua-new-class/components/ua-new-class';
import {ExerciseComponent} from '../../../pages/ua-exercise/components/ua-exercise';
import {HelpStudentComponent} from '../../../pages/ua-help-student/components/ua-help-student';
import {HelpProfComponent} from '../../../pages/ua-help-prof/components/ua-help-prof';
import {AccountComponent} from '../../../pages/ua-account/components/ua-account';
import {PhenositoryReloadComponent} from '../../../pages/ua-phenository-reload/components/ua-phenository-reload';

import {TopNavComponent} from '../../../shared/topnav/topnav';
import {SidebarComponent} from '../../../shared/sidebar/sidebar';

@Component({
  moduleId: module.id,
  selector: 'dashboard-cmp',
  templateUrl: 'dashboard.html',
  encapsulation: ViewEncapsulation.None,
  directives: [[ROUTER_DIRECTIVES, TopNavComponent, SidebarComponent]]
})

//noinspection TypeScriptValidateTypes
@Routes([
  { path: '/home', component: HomeComponent},
  { path: '/in-progress/:id', component: InProgressComponent},
  { path: '/in-progress', component: InProgressComponent},
  { path: '/my-annotations', component: MyAnnotationsComponent},
  { path: '/phenository', component: PhenositoryComponent},
  { path: '/class-student/:id', component: ClassStudentComponent},
  { path: '/class-prof/:id', component: ClassProfComponent},
  { path: '/join-class', component: JoinClassComponent},
  { path: '/new-class', component: NewClassComponent},
  { path: '/exercise/:id', component: ExerciseComponent},
  { path: '/help-student', component: HelpStudentComponent},
  { path: '/help-prof', component: HelpProfComponent},
  { path: '/account', component: AccountComponent},
  { path: '/phenository-reload', component: PhenositoryReloadComponent}
])

export class DashboardComponent { }
