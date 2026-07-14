
class Component extends DCLogic {
  state = { role: 'admin', screen: 'adminDash', lang: 'fr', playerTab: 'overview', playing: false, lessonId: 3, quizPick: null, quizAnswered: false, activeGroup: 'all', likes: {} };

  DICT = {
    fr: { menu:'Menu', viewAs:'Voir en tant que', search:'Rechercher un cours, Ã©tudiantâ€¦', dashboard:'Tableau de bord', courses:'Cours', students:'Ã‰tudiants', student:'Ã‰tudiant', teachers:'Professeurs', sales:'Ventes & Paiements', community:'Community', myCourses:'Mes cours', certificates:'Certificats', certificate:'Certificat', catalog:'Catalogue',
      revenueTitle:'Revenus mensuels', last12:'12 derniers mois', enrollMix:'RÃ©partition', byCategory:'Par catÃ©gorie', topCourses:'Cours les plus vendus', viewAll:'Tout voir', activity:'ActivitÃ©', recent:'Ã‰vÃ©nements rÃ©cents', earned:'gagnÃ©s', newCourse:'Nouveau cours', enrolledCourses:'Cours suivis', progress:'Progression', lastActive:'DerniÃ¨re activitÃ©', instructors:'formateurs actifs', inviteTeacher:'Inviter un professeur', rating:'Note', recentTx:'Transactions rÃ©centes', customer:'Client', course:'Cours', plan:'Formule', amount:'Montant', mrr:'Revenu rÃ©current (MRR)', thisMonth:'ce mois', coupons:'Coupons actifs', add:'Ajouter', uses:'utilisations', groups:'Groupes', shareSomething:'Partagez une question, une victoireâ€¦', post:'Publier', share:'Partager', upcomingEvents:'Ã‰vÃ©nements Ã  venir', leaderboard:'Classement', welcomeBack:'Bon retour', continueLearning:'Reprends lÃ  oÃ¹ tu t\u2019es arrÃªtÃ©', inProgress:'en cours', watched:'visionnÃ©es', points:'points', lessons:'leÃ§ons', complete:'terminÃ©', backToCourses:'Retour aux cours', live:'Session live', question:'Question', submit:'Valider', takeNotes:'Prends tes notes iciâ€¦', issuedTo:'DÃ©livrÃ© Ã ', manage:'GÃ©rer', studentQuestions:'Questions des Ã©tudiants', needsReply:'En attente de rÃ©ponse', signOut:'DÃ©connexion' },
    en: { menu:'Menu', viewAs:'View as', search:'Search a course, studentâ€¦', dashboard:'Dashboard', courses:'Courses', students:'Students', student:'Student', teachers:'Teachers', sales:'Sales & Payments', community:'Community', myCourses:'My courses', certificates:'Certificates', certificate:'Certificate', catalog:'Catalog',
      revenueTitle:'Monthly revenue', last12:'Last 12 months', enrollMix:'Breakdown', byCategory:'By category', topCourses:'Best selling courses', viewAll:'View all', activity:'Activity', recent:'Recent events', earned:'earned', newCourse:'New course', enrolledCourses:'Enrolled courses', progress:'Progress', lastActive:'Last active', instructors:'active instructors', inviteTeacher:'Invite a teacher', rating:'Rating', recentTx:'Recent transactions', customer:'Customer', course:'Course', plan:'Plan', amount:'Amount', mrr:'Recurring revenue (MRR)', thisMonth:'this month', coupons:'Active coupons', add:'Add', uses:'uses', groups:'Groups', shareSomething:'Share a question, a winâ€¦', post:'Post', share:'Share', upcomingEvents:'Upcoming events', leaderboard:'Leaderboard', welcomeBack:'Welcome back', continueLearning:'Pick up where you left off', inProgress:'in progress', watched:'watched', points:'points', lessons:'lessons', complete:'complete', backToCourses:'Back to courses', live:'Live session', question:'Question', submit:'Submit', takeNotes:'Take your notes hereâ€¦', issuedTo:'Issued to', manage:'Manage', studentQuestions:'Student questions', needsReply:'Awaiting reply', signOut:'Sign out' },
    es: { menu:'MenÃº', viewAs:'Ver como', search:'Buscar un curso, estudianteâ€¦', dashboard:'Panel', courses:'Cursos', students:'Estudiantes', student:'Estudiante', teachers:'Profesores', sales:'Ventas y Pagos', community:'Comunidad', myCourses:'Mis cursos', certificates:'Certificados', certificate:'Certificado', catalog:'CatÃ¡logo',
      revenueTitle:'Ingresos mensuales', last12:'Ãšltimos 12 meses', enrollMix:'DistribuciÃ³n', byCategory:'Por categorÃ­a', topCourses:'Cursos mÃ¡s vendidos', viewAll:'Ver todo', activity:'Actividad', recent:'Eventos recientes', earned:'ganados', newCourse:'Nuevo curso', enrolledCourses:'Cursos inscritos', progress:'Progreso', lastActive:'Ãšltima actividad', instructors:'formadores activos', inviteTeacher:'Invitar profesor', rating:'Nota', recentTx:'Transacciones recientes', customer:'Cliente', course:'Curso', plan:'Plan', amount:'Importe', mrr:'Ingreso recurrente (MRR)', thisMonth:'este mes', coupons:'Cupones activos', add:'AÃ±adir', uses:'usos', groups:'Grupos', shareSomething:'Comparte una pregunta, un logroâ€¦', post:'Publicar', share:'Compartir', upcomingEvents:'PrÃ³ximos eventos', leaderboard:'ClasificaciÃ³n', welcomeBack:'Bienvenido', continueLearning:'ContinÃºa donde lo dejaste', inProgress:'en curso', watched:'vistas', points:'puntos', lessons:'lecciones', complete:'completado', backToCourses:'Volver a cursos', live:'SesiÃ³n en vivo', question:'Pregunta', submit:'Enviar', takeNotes:'Escribe tus notas aquÃ­â€¦', issuedTo:'Emitido a', manage:'Gestionar', studentQuestions:'Preguntas de estudiantes', needsReply:'Esperando respuesta', signOut:'Salir' }
  };

  componentDidMount(){ this.renderIcons(); }
  componentDidUpdate(){ this.renderIcons(); }
  renderIcons(){ if(window.lucide){ try{ window.lucide.createIcons(); }catch(e){} } }

  go(screen){ this.setState({ screen }); }
  setRole(role){ const home = { admin:'adminDash', student:'stuCourses', teacher:'teaDash' }[role]; this.setState({ role, screen: home }); }
  setLang(lang){ this.setState({ lang }); }
  openCourse(){ this.setState({ screen:'stuPlayer' }); }

  navStyle(active){ return `display:flex;align-items:center;gap:12px;height:42px;padding:0 13px;border-radius:11px;border:none;cursor:pointer;font-family:'Manrope';font-weight:${active?700:600};font-size:13.5px;transition:all .16s;background:${active?'rgba(217,164,65,.16)':'transparent'};color:${active?'#F0C978':'#B6C4D6'};border-left:3px solid ${active?'#D9A441':'transparent'};padding-left:${active?'10px':'13px'}`; }

  renderVals(){
    const L = this.DICT[this.state.lang];
    const s = this.state.screen;
    const role = this.state.role;

    const show = { adminDash:s==='adminDash', adminCourses:s==='adminCourses', adminStudents:s==='adminStudents', adminTeachers:s==='adminTeachers', adminSales:s==='adminSales',
      community:s==='community', stuCourses:s==='stuCourses', stuPlayer:s==='stuPlayer', stuCerts:s==='stuCerts', teaDash:s==='teaDash', teaCourses:s==='adminCourses'&&role==='teacher' };

    // NAV per role
    const navDefs = {
      admin: [ ['adminDash','dashboard','layout-dashboard'], ['adminCourses','courses','book-open'], ['adminStudents','students','graduation-cap'], ['adminTeachers','teachers','users'], ['adminSales','sales','credit-card'], ['community','community','messages-square','12'] ],
      student: [ ['stuCourses','myCourses','book-open'], ['community','community','messages-square','3'], ['stuCerts','certificates','award'] ],
      teacher: [ ['teaDash','dashboard','layout-dashboard'], ['adminCourses','courses','book-open'], ['adminStudents','students','graduation-cap'], ['community','community','messages-square'] ]
    };
    const nav = navDefs[role].map(([id,key,icon,badge]) => ({ id, icon, label: L[key], go: () => this.go(id), style: this.navStyle(s===id),
      badge: badge||'', badgeStyle:'font-size:10.5px;font-weight:800;background:#D9A441;color:#0F2C4C;min-width:20px;height:18px;border-radius:9px;display:flex;align-items:center;justify-content:center;padding:0 5px' }));

    const roleBtn = (r,short,label) => ({ short, label, go:()=>this.setRole(r),
      style:`flex:1;height:34px;border:none;border-radius:8px;cursor:pointer;font-family:'Sora';font-weight:700;font-size:12px;transition:all .16s;background:${role===r?'#D9A441':'transparent'};color:${role===r?'#0F2C4C':'#9DB0C7'}` });
    const roles = [ roleBtn('admin','Admin','Admin'), roleBtn('teacher','Prof','Professeur'), roleBtn('student','Ã‰lÃ¨ve','Ã‰tudiant') ];

    const langBtn = (code) => ({ code, go:()=>this.setLang(code.toLowerCase()),
      style:`width:34px;height:30px;border:none;border-radius:8px;cursor:pointer;font-family:'Manrope';font-weight:800;font-size:11.5px;transition:all .16s;background:${this.state.lang===code.toLowerCase()?'#0F2C4C':'transparent'};color:${this.state.lang===code.toLowerCase()?'#fff':'#8494A8'}` });
    const langs = [ langBtn('FR'), langBtn('EN'), langBtn('ES') ];

    const me = role==='admin' ? { initials:'JD', name:'Jean Deshommes', first:'Jean', role:L.dashboard==='Dashboard'?'Administrator':(this.state.lang==='es'?'Administrador':'Administrateur') }
      : role==='teacher' ? { initials:'SM', name:'Sarah Morel', first:'Sarah', role: this.state.lang==='en'?'Instructor':(this.state.lang==='es'?'Instructor':'Formatrice') }
      : { initials:'LT', name:'Lina Toussaint', first:'Lina', role: this.state.lang==='en'?'Student':(this.state.lang==='es'?'Estudiante':'Ã‰tudiante') };

    // Page titles
    const titleMap = {
      adminDash:[L.dashboard, this.state.lang==='en'?'Overview of your academy':(this.state.lang==='es'?'Resumen de tu academia':'Vue d\u2019ensemble de ton acadÃ©mie')],
      adminCourses:[L.courses, this.state.lang==='en'?'Create, publish and price your courses':(this.state.lang==='es'?'Crea, publica y fija precios':'CrÃ©e, publie et tarife tes cours')],
      adminStudents:[L.students, this.state.lang==='en'?'Enrollments and progress':(this.state.lang==='es'?'Inscripciones y progreso':'Inscriptions et progression')],
      adminTeachers:[L.teachers, this.state.lang==='en'?'Instructors and permissions':(this.state.lang==='es'?'Formadores y permisos':'Formateurs et permissions')],
      adminSales:[L.sales, this.state.lang==='en'?'Revenue, plans and coupons':(this.state.lang==='es'?'Ingresos, planes y cupones':'Revenus, formules et coupons')],
      community:[L.community, this.state.lang==='en'?'Discussions, groups and events':(this.state.lang==='es'?'Debates, grupos y eventos':'Discussions, groupes et Ã©vÃ©nements')],
      stuCourses:[L.myCourses, this.state.lang==='en'?'Your learning journey':(this.state.lang==='es'?'Tu ruta de aprendizaje':'Ta progression')],
      stuPlayer:[this.state.lang==='en'?'Now playing':(this.state.lang==='es'?'Reproduciendo':'Lecture en cours'), 'FiscalitÃ© des indÃ©pendants'],
      stuCerts:[L.certificates, this.state.lang==='en'?'Your earned credentials':(this.state.lang==='es'?'Tus credenciales':'Tes attestations obtenues')],
      teaDash:[L.dashboard, this.state.lang==='en'?'Your teaching at a glance':(this.state.lang==='es'?'Tu enseÃ±anza':'Ton activitÃ© de formateur')]
    };
    const pg = titleMap[s] || [L.dashboard,''];
    const page = { title: pg[0], sub: pg[1] };

    // ---- ADMIN DASHBOARD DATA
    const kpis = [
      { icon:'dollar-sign', tint:'#EAF6EF', color:'#1F8A5B', value:'$284.9k', label:this.state.lang==='en'?'Total revenue':(this.state.lang==='es'?'Ingresos totales':'Revenu total'), delta:'+18.4%', arrow:'trending-up', deltaStyle:'display:flex;align-items:center;gap:3px;font-size:12px;font-weight:800;color:#1F8A5B;background:#EAF6EF;padding:3px 8px;border-radius:8px' },
      { icon:'graduation-cap', tint:'#EAF1FB', color:'#1B5FB0', value:'3,842', label:this.state.lang==='en'?'Active students':(this.state.lang==='es'?'Estudiantes activos':'Ã‰tudiants actifs'), delta:'+9.1%', arrow:'trending-up', deltaStyle:'display:flex;align-items:center;gap:3px;font-size:12px;font-weight:800;color:#1F8A5B;background:#EAF6EF;padding:3px 8px;border-radius:8px' },
      { icon:'book-open', tint:'#FBF1E1', color:'#C99A2E', value:'48', label:this.state.lang==='en'?'Published courses':(this.state.lang==='es'?'Cursos publicados':'Cours publiÃ©s'), delta:'+4', arrow:'trending-up', deltaStyle:'display:flex;align-items:center;gap:3px;font-size:12px;font-weight:800;color:#1F8A5B;background:#EAF6EF;padding:3px 8px;border-radius:8px' },
      { icon:'percent', tint:'#F3EDFB', color:'#7C5CD6', value:'68%', label:this.state.lang==='en'?'Completion rate':(this.state.lang==='es'?'Tasa de finalizaciÃ³n':'Taux de complÃ©tion'), delta:'-2.3%', arrow:'trending-down', deltaStyle:'display:flex;align-items:center;gap:3px;font-size:12px;font-weight:800;color:#D14343;background:#FBEBEB;padding:3px 8px;border-radius:8px' }
    ];
    const revData = [42,48,45,58,62,55,70,74,68,82,88,95];
    const months = ['J','F','M','A','M','J','J','A','S','O','N','D'];
    const maxRev = Math.max(...revData);
    const revBars = revData.map((v,i)=>({ h: Math.round(v/maxRev*100)+'%', m: months[i], fill: i>=10?'linear-gradient(180deg,#E7B450,#D9A441)':'linear-gradient(180deg,#2E5E93,#1B4B7F)' }));
    const mix = [ {name:this.state.lang==='en'?'Tax preparation':(this.state.lang==='es'?'PreparaciÃ³n fiscal':'FiscalitÃ©'),pct:38,w:'38%',fill:'#0F2C4C'}, {name:this.state.lang==='en'?'Insurance':(this.state.lang==='es'?'Seguros':'Assurance'),pct:27,w:'27%',fill:'#1B5FB0'}, {name:this.state.lang==='en'?'Finance':(this.state.lang==='es'?'Finanzas':'Finance'),pct:21,w:'21%',fill:'#D9A441'}, {name:'Medicare',pct:14,w:'14%',fill:'#7C5CD6'} ];

    const courseData = [
      { title:'FiscalitÃ© des indÃ©pendants 2026', instructor:'Sarah Morel', students:842, price:'$149', revenue:'$62.4k', rating:'4.9', cover:'linear-gradient(135deg,#0F2C4C,#1B4B7F)', icon:'file-text', category:this.state.lang==='en'?'Tax':(this.state.lang==='es'?'Fiscal':'FiscalitÃ©'), status:'published' },
      { title:'PrÃ©parer sa dÃ©claration IRS de A Ã  Z', instructor:'Marc RiviÃ¨re', students:1203, price:'$99', revenue:'$58.9k', rating:'4.8', cover:'linear-gradient(135deg,#1B5FB0,#2E7DD1)', icon:'landmark', category:this.state.lang==='en'?'Tax':(this.state.lang==='es'?'Fiscal':'FiscalitÃ©'), status:'published' },
      { title:'Assurance-vie : vendre en confiance', instructor:'Nadia Belkacem', students:521, price:'$129', revenue:'$41.2k', rating:'4.7', cover:'linear-gradient(135deg,#7C5CD6,#9B7BE8)', icon:'shield', category:this.state.lang==='en'?'Insurance':(this.state.lang==='es'?'Seguros':'Assurance'), status:'published' },
      { title:'Obamacare & subventions expliquÃ©s', instructor:'Marc RiviÃ¨re', students:388, price:'$79', revenue:'$24.8k', rating:'4.6', cover:'linear-gradient(135deg,#1F8A5B,#35A874)', icon:'heart-pulse', category:'Health', status:'published' },
      { title:'Logiciel fiscal pro : maÃ®trise complÃ¨te', instructor:'Sarah Morel', students:264, price:'$189', revenue:'$19.4k', rating:'4.9', cover:'linear-gradient(135deg,#C99A2E,#E7B450)', icon:'monitor', category:this.state.lang==='en'?'Software':(this.state.lang==='es'?'Software':'Logiciel'), status:'published' },
      { title:'Medicare : accompagner les 65+', instructor:'Nadia Belkacem', students:0, price:'$109', revenue:'$0', rating:'â€”', cover:'linear-gradient(135deg,#556575,#6E8093)', icon:'stethoscope', category:'Medicare', status:'draft' }
    ];
    const statusChip = (st) => st==='published'
      ? { statusLabel:this.state.lang==='en'?'Published':(this.state.lang==='es'?'Publicado':'PubliÃ©'), statusStyle:'font-size:11px;font-weight:700;color:#fff;background:rgba(31,138,91,.9);padding:3px 10px;border-radius:20px' }
      : { statusLabel:this.state.lang==='en'?'Draft':(this.state.lang==='es'?'Borrador':'Brouillon'), statusStyle:'font-size:11px;font-weight:700;color:#fff;background:rgba(0,0,0,.32);padding:3px 10px;border-radius:20px' };
    const courses = courseData.map(c => ({ ...c, ...statusChip(c.status), open:()=>this.openCourse() }));
    const topCourses = courseData.slice(0,4);

    const courseFilters = [ ['all','Tous',48],['published','PubliÃ©s',44],['draft','Brouillons',3],['top','Populaires',12] ].map(([id,lbl,cnt],i)=>({ label: this.state.lang==='en'?['All','Published','Drafts','Popular'][i]:(this.state.lang==='es'?['Todos','Publicados','Borradores','Populares'][i]:lbl), count:cnt,
      go:()=>{}, style:`height:36px;padding:0 14px;border-radius:10px;border:1px solid ${i===0?'#0F2C4C':'#E2E8F0'};background:${i===0?'#0F2C4C':'#fff'};color:${i===0?'#fff':'#5B6B82'};font-family:'Manrope';font-weight:700;font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:6px` }));

    const activity = [
      { icon:'user-plus', tint:'#EAF1FB', color:'#1B5FB0', text: this.state.lang==='en'?'Karim B. enrolled in â€œTax preparation A-Zâ€':(this.state.lang==='es'?'Karim B. se inscribiÃ³ en â€œPreparaciÃ³n fiscalâ€':'Karim B. s\u2019est inscrit Ã  Â« PrÃ©parer sa dÃ©claration IRS Â»'), time:'2 min' },
      { icon:'dollar-sign', tint:'#EAF6EF', color:'#1F8A5B', text: this.state.lang==='en'?'New sale Â· $149 Â· Tax course':(this.state.lang==='es'?'Nueva venta Â· $149':'Nouvelle vente Â· $149 Â· Cours fiscalitÃ©'), time:'14 min' },
      { icon:'award', tint:'#FBF1E1', color:'#C99A2E', text: this.state.lang==='en'?'Lina T. earned a certificate':(this.state.lang==='es'?'Lina T. obtuvo un certificado':'Lina T. a obtenu un certificat'), time:'1 h' },
      { icon:'message-square', tint:'#F3EDFB', color:'#7C5CD6', text: this.state.lang==='en'?'12 new posts in Community':(this.state.lang==='es'?'12 publicaciones nuevas':'12 nouveaux posts dans la Community'), time:'3 h' },
      { icon:'star', tint:'#FBF1E1', color:'#C99A2E', text: this.state.lang==='en'?'Sarah M. course rated 5â˜…':(this.state.lang==='es'?'Curso de Sarah M. valorado 5â˜…':'Le cours de Sarah M. notÃ© 5â˜…'), time:'5 h' }
    ];

    // STUDENTS
    const av = ['linear-gradient(135deg,#0F2C4C,#1B4B7F)','linear-gradient(135deg,#7C5CD6,#9B7BE8)','linear-gradient(135deg,#1F8A5B,#35A874)','linear-gradient(135deg,#C99A2E,#E7B450)','linear-gradient(135deg,#D14343,#E86A6A)','linear-gradient(135deg,#1B5FB0,#2E7DD1)'];
    const stuRaw = [ ['Lina Toussaint','lina.t@mail.com',3,88,'2 h',0,'Premium'],['Karim Benali','karim.b@mail.com',2,54,'1 j',1,'Unique'],['Sofia Alvarez','sofia.a@mail.com',5,72,'3 h',2,'Premium'],['James Cole','james.c@mail.com',1,20,'5 j',3,'Gratuit'],['Amina Diallo','amina.d@mail.com',4,95,'12 min',4,'Premium'],['Peter Nkemba','peter.n@mail.com',2,41,'2 j',5,'Unique'],['Rosa Iglesias','rosa.i@mail.com',3,63,'6 h',1,'Premium'] ];
    const planChip = (p) => { const map={Premium:['#EAF1FB','#1B5FB0'],Unique:['#FBF1E1','#C99A2E'],'Gratuit':['#EEF2F7','#7C8AA0']}; const c=map[p]||map.Gratuit; const label = this.state.lang==='en'?({Premium:'Premium',Unique:'One-time','Gratuit':'Free'})[p]:(this.state.lang==='es'?({Premium:'Premium',Unique:'Ãšnico','Gratuit':'Gratis'})[p]:p); return `font-size:11px;font-weight:700;color:${c[1]};background:${c[0]};padding:4px 10px;border-radius:20px` ; };
    const planLabel = (p)=> this.state.lang==='en'?({Premium:'Premium',Unique:'One-time','Gratuit':'Free'})[p]:(this.state.lang==='es'?({Premium:'Premium',Unique:'Ãšnico','Gratuit':'Gratis'})[p]:p);
    const students = stuRaw.map(([name,email,cn,pr,last,ai,plan]) => ({ name, email, courses:cn, prog:pr+'%', last, initials:name.split(' ').map(w=>w[0]).join(''), avatar:av[ai], progFill: pr>=75?'linear-gradient(90deg,#1F8A5B,#35A874)':(pr>=40?'linear-gradient(90deg,#D9A441,#E7B450)':'linear-gradient(90deg,#D14343,#E86A6A)'), plan:planLabel(plan), planStyle:planChip(plan) }));
    const studentStats = [ ['Total Ã©tudiants','Total students','Total estudiantes','3,842'],['Actifs cette semaine','Active this week','Activos esta semana','1,204'],['Nouveaux (30j)','New (30d)','Nuevos (30d)','+318'],['AbonnÃ©s Premium','Premium subscribers','Suscriptores Premium','962'] ].map(([fr,en,es,v])=>({ label: this.state.lang==='en'?en:(this.state.lang==='es'?es:fr), value:v }));

    // TEACHERS
    const teachers = [
      { name:'Sarah Morel', specialty:this.state.lang==='en'?'Tax & Software':'FiscalitÃ© & Logiciel', initials:'SM', avatar:av[0], roleTag: this.state.lang==='en'?'Lead instructor':'Formatrice principale', status:'active', courses:6, students:1370, rating:'4.9' },
      { name:'Marc RiviÃ¨re', specialty:this.state.lang==='en'?'IRS & Health':'IRS & SantÃ©', initials:'MR', avatar:av[1], roleTag:'Senior', status:'active', courses:4, students:1591, rating:'4.8' },
      { name:'Nadia Belkacem', specialty:this.state.lang==='en'?'Insurance & Medicare':'Assurance & Medicare', initials:'NB', avatar:av[2], roleTag: this.state.lang==='en'?'Instructor':'Formatrice', status:'active', courses:3, students:909, rating:'4.7' },
      { name:'David Osei', specialty:'Finance', initials:'DO', avatar:av[3], roleTag: this.state.lang==='en'?'Instructor':'Formateur', status:'pending', courses:1, students:0, rating:'â€”' },
      { name:'Elena Costa', specialty:this.state.lang==='en'?'Onboarding':'Accueil client', initials:'EC', avatar:av[4], roleTag:'Assistant', status:'active', courses:2, students:214, rating:'4.5' },
      { name:'Tom Wagner', specialty:'Medicare', initials:'TW', avatar:av[5], roleTag: this.state.lang==='en'?'Instructor':'Formateur', status:'active', courses:2, students:340, rating:'4.6' }
    ].map(t => ({ ...t, statusLabel: t.status==='active'?(this.state.lang==='en'?'Active':(this.state.lang==='es'?'Activo':'Actif')):(this.state.lang==='en'?'Pending':(this.state.lang==='es'?'Pendiente':'En attente')),
      statusStyle: t.status==='active'?'font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:#EAF6EF;color:#1F8A5B':'font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;background:#FBF3E1;color:#C99A2E' }));

    // SALES
    const salesStats = [ ['dollar-sign','#1F8A5B','Revenu 30j','30d revenue','Ingresos 30d','$38,420'],['shopping-cart','#1B5FB0','Ventes 30j','Sales 30d','Ventas 30d','412'],['repeat','#7C5CD6','Abonnements','Subscriptions','Suscripciones','962'],['ticket','#C99A2E','Panier moyen','Avg. order','Pedido medio','$118'] ].map(([icon,color,fr,en,es,v])=>({ icon, color, label: this.state.lang==='en'?en:(this.state.lang==='es'?es:fr), value:v }));
    const txPlan = (p)=>{ const map={Unique:['#FBF1E1','#C99A2E'],Premium:['#EAF1FB','#1B5FB0'],Pack:['#F3EDFB','#7C5CD6']}; const c=map[p]; return `justify-self:start;font-size:11px;font-weight:700;color:${c[1]};background:${c[0]};padding:3px 9px;border-radius:20px`; };
    const transactions = [
      ['Karim Benali','PrÃ©parer sa dÃ©claration IRS','Unique','$99','13 juil.',1],
      ['Sofia Alvarez','Abonnement Premium','Premium','$29','13 juil.',2],
      ['Amina Diallo','Pack FiscalitÃ© complet','Pack','$249','12 juil.',4],
      ['James Cole','FiscalitÃ© des indÃ©pendants','Unique','$149','12 juil.',3],
      ['Rosa Iglesias','Abonnement Premium','Premium','$29','11 juil.',1],
      ['Peter Nkemba','Logiciel fiscal pro','Unique','$189','11 juil.',5],
      ['Lina Toussaint','Pack Assurance','Pack','$199','10 juil.',0]
    ].map(([name,course,plan,amount,date,ai])=>({ name, course, plan, amount, date, initials:name.split(' ').map(w=>w[0]).join(''), avatar:av[ai], planStyle:txPlan(plan) }));
    const coupons = [ {code:'LAUNCH30',uses:184,discount:'-30%'}, {code:'BIENVENUE',uses:521,discount:'-15%'}, {code:'PACK2026',uses:67,discount:'-$50'} ];

    // COMMUNITY
    const groups = [ ['all','Tous les groupes','#D9A441','1.2k'],['tax','FiscalitÃ© 2026','#1B5FB0','842'],['insurance','Assurance-vie','#7C5CD6','521'],['software','Logiciel fiscal','#1F8A5B','264'],['newbies','DÃ©butants','#C99A2E','390'] ].map(([id,name,dot,count],i)=>({ name: id==='all'?(this.state.lang==='en'?'All groups':(this.state.lang==='es'?'Todos los grupos':name)):name, dot, count,
      go:()=>this.setState({activeGroup:id}), style:`display:flex;align-items:center;gap:9px;height:40px;padding:0 12px;border-radius:11px;border:none;cursor:pointer;font-family:'Manrope';font-weight:700;font-size:13px;background:${this.state.activeGroup===id?'#fff':'transparent'};color:${this.state.activeGroup===id?'#0F2C4C':'#5B6B82'};box-shadow:${this.state.activeGroup===id?'0 1px 4px rgba(0,0,0,.06)':'none'}` }));
    const tagStyle = (t)=>{ const map={Prof:['#EAF1FB','#1B5FB0'],Admin:['#FBF1E1','#C99A2E']}; const c=map[t]; return c?`font-size:10px;font-weight:800;color:${c[1]};background:${c[0]};padding:2px 7px;border-radius:6px;margin-left:5px`:'display:none'; };
    const postRaw = [
      ['Sarah Morel','Prof','FiscalitÃ© 2026','2 h',0,'Rappel : la session live sur les dÃ©ductions pour indÃ©pendants est demain Ã  18h. PrÃ©parez vos questions ! ðŸ“Š',124,'p0'],
      ['Karim Benali','','DÃ©butants','5 h',1,'Je viens de terminer le module 3, les exemples concrets m\u2019ont enfin fait comprendre les crÃ©dits d\u2019impÃ´t. Merci Ã  toute la communautÃ© ðŸ™',56,'p1'],
      ['Jean Deshommes','Admin','Tous les groupes','1 j',2,'Bienvenue aux 318 nouveaux membres ce mois-ci ! N\u2019hÃ©sitez pas Ã  vous prÃ©senter dans le groupe DÃ©butants.',210,'p2'],
      ['Amina Diallo','','Logiciel fiscal','1 j',4,'Astuce : le raccourci Ctrl+D dans le logiciel duplique une dÃ©claration type. Ã‡a m\u2019a fait gagner des heures !',89,'p3']
    ];
    const posts = postRaw.map(([name,tag,group,time,ai,text,likes,id])=>{ const liked=!!this.state.likes[id]; return { name, tag, group, time, text, initials:name.split(' ').map(w=>w[0]).join(''), avatar:av[ai], tagStyle:tagStyle(tag), comments: (id.charCodeAt(1)-47)*4+8, likes: likes+(liked?1:0), like:()=>this.setState(st=>({likes:{...st.likes,[id]:!st.likes[id]}})), likeStyle:`display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;cursor:pointer;background:none;border:none;color:${liked?'#D14343':'#8494A8'}` }; });
    const events = [ ['15','JUIL',this.state.lang==='en'?'Live: Self-employed deductions':'Live : DÃ©ductions indÃ©pendants','18:00 Â· Sarah M.'],['18','JUIL',this.state.lang==='en'?'Q&A: Obamacare 2026':'Q&A : Obamacare 2026','12:00 Â· Marc R.'],['22','JUIL',this.state.lang==='en'?'Workshop: Pro software':'Atelier : Logiciel pro','17:30 Â· Sarah M.'] ].map(([day,mon,title,time])=>({ day, mon, title, time }));
    const leaderboard = [ ['Amina Diallo',4,'2,480'],['Lina Toussaint',0,'1,240'],['Sofia Alvarez',2,'1,180'],['Karim Benali',1,'960'],['Rosa Iglesias',1,'820'] ].map(([name,ai,pts],i)=>({ name, pts, initials:name.split(' ').map(w=>w[0]).join(''), avatar:av[ai], rank:i+1,
      rankStyle:`width:22px;height:22px;flex:none;border-radius:7px;display:flex;align-items:center;justify-content:center;font-family:'Sora';font-weight:800;font-size:11px;color:${i===0?'#0F2C4C':'#fff'};background:${['#E7B450','#9FB0C4','#C99A2E','#B8C2CF','#B8C2CF'][i]}` }));

    // STUDENT MY COURSES
    const myRaw = [
      ['FiscalitÃ© des indÃ©pendants 2026','Sarah Morel','FiscalitÃ©',7,12,58,'linear-gradient(135deg,#0F2C4C,#1B4B7F)'],
      ['PrÃ©parer sa dÃ©claration IRS de A Ã  Z','Marc RiviÃ¨re','FiscalitÃ©',18,20,90,'linear-gradient(135deg,#1B5FB0,#2E7DD1)'],
      ['Assurance-vie : vendre en confiance','Nadia Belkacem','Assurance',3,15,20,'linear-gradient(135deg,#7C5CD6,#9B7BE8)'],
      ['Logiciel fiscal pro','Sarah Morel','Logiciel',10,10,100,'linear-gradient(135deg,#C99A2E,#E7B450)'],
      ['Obamacare & subventions','Marc RiviÃ¨re','SantÃ©',5,14,36,'linear-gradient(135deg,#1F8A5B,#35A874)'],
      ['Medicare : accompagner les 65+','Nadia Belkacem','Medicare',0,11,0,'linear-gradient(135deg,#556575,#6E8093)']
    ];
    const myCourses = myRaw.map(([title,instructor,category,done,lessons,prog,cover])=>({ title, instructor, category, done, lessons, prog:prog+'%', cover, open:()=>this.openCourse() }));

    // COURSE PLAYER
    const modDefs = [
      { name:'Module 1 Â· Fondamentaux', lessons:[ [1,'Introduction Ã  la fiscalitÃ©','6:20','done'],[2,'Statuts juridiques','12:40','done'],[3,'RÃ©gimes d\u2019imposition','31:47','current'] ] },
      { name:'Module 2 Â· DÃ©ductions', lessons:[ [4,'Charges dÃ©ductibles','18:10','locked'],[5,'Amortissements','22:05','locked'],[6,'Quiz : DÃ©ductions','â€”','locked'] ] },
      { name:'Module 3 Â· DÃ©claration', lessons:[ [7,'Remplir le formulaire','15:30','locked'],[8,'Cas pratique complet','28:00','locked'] ] }
    ];
    const lessonState = (st,active)=>{ if(active) return { icon:'play', iconWrap:'width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#D9A441;color:#0F2C4C', titleColor:'#0F2C4C' };
      if(st==='done') return { icon:'check', iconWrap:'width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#EAF6EF;color:#1F8A5B', titleColor:'#5B6B82' };
      return { icon:'lock', iconWrap:'width:26px;height:26px;flex:none;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#F1F4F8;color:#B0BCCB', titleColor:'#9AA7B8' }; };
    let curLesson = { module:'Module 1 Â· Fondamentaux', title:'RÃ©gimes d\u2019imposition', desc:'Dans cette leÃ§on, nous comparons les rÃ©gimes micro-entreprise, rÃ©el simplifiÃ© et rÃ©el normal. Tu apprendras Ã  choisir le rÃ©gime le plus avantageux selon ton chiffre d\u2019affaires et Ã  anticiper tes obligations dÃ©claratives.' };
    const modules = modDefs.map(m=>({ name:m.name, lessons:m.lessons.map(([id,title,dur,st])=>{ const active=id===this.state.lessonId; if(active){ curLesson.title=title; } return { title, dur, go:()=>this.setState({lessonId:id, playerTab:'overview'}), style:`display:flex;align-items:center;gap:11px;width:100%;padding:11px 20px;border:none;cursor:pointer;background:${active?'#FBF7EE':'transparent'};border-left:3px solid ${active?'#D9A441':'transparent'}`, ...lessonState(st,active) }; }) }));
    const playerCourse = { title:'FiscalitÃ© des indÃ©pendants 2026', prog:'58%', doneCount:7, total:12 };
    const playerTabs = [ ['overview','AperÃ§u','Overview','Resumen'],['resources','Ressources','Resources','Recursos'],['quiz','Quiz','Quiz','Quiz'],['notes','Notes','Notes','Notas'] ].map(([id,fr,en,es])=>({ label:this.state.lang==='en'?en:(this.state.lang==='es'?es:fr), go:()=>this.setState({playerTab:id}),
      style:`height:40px;padding:0 4px;margin-right:18px;border:none;background:none;cursor:pointer;font-family:'Manrope';font-weight:700;font-size:14px;color:${this.state.playerTab===id?'#0F2C4C':'#93A1B4'};border-bottom:2.5px solid ${this.state.playerTab===id?'#D9A441':'transparent'}` }));
    const tab = { overview:this.state.playerTab==='overview', resources:this.state.playerTab==='resources', quiz:this.state.playerTab==='quiz', notes:this.state.playerTab==='notes' };
    const lessonMeta = [ {icon:'clock',label:this.state.lang==='en'?'Duration':'DurÃ©e',value:'31:47'},{icon:'bar-chart-2',label:this.state.lang==='en'?'Level':'Niveau',value:this.state.lang==='en'?'Intermediate':'IntermÃ©diaire'},{icon:'globe',label:'Audio',value:'FR Â· EN Â· ES'} ];
    const resources = [ {name:'Support de cours â€“ RÃ©gimes.pdf',size:'2.4 MB',icon:'file-text',tint:'#FBEBEB',color:'#D14343'},{name:'Tableau comparatif.xlsx',size:'840 KB',icon:'table',tint:'#EAF6EF',color:'#1F8A5B'},{name:'ModÃ¨le de dÃ©claration.docx',size:'320 KB',icon:'file',tint:'#EAF1FB',color:'#1B5FB0'} ];

    // QUIZ
    const correct = 1;
    const qOpts = [ 'Le rÃ©gime micro-entreprise','Le rÃ©gime rÃ©el simplifiÃ© pour optimiser les charges','Toujours le rÃ©gime rÃ©el normal','Aucun, c\u2019est automatique' ].map((text,i)=>{ const picked=this.state.quizPick===i; const answered=this.state.quizAnswered; let bg='#fff',bd='#E6EBF1',icon='circle',ic='#C9D2DF';
      if(answered && i===correct){ bg='#EAF6EF'; bd='#1F8A5B'; icon='check-circle'; ic='#1F8A5B'; }
      else if(answered && picked && i!==correct){ bg='#FBEBEB'; bd='#D14343'; icon='x-circle'; ic='#D14343'; }
      else if(picked){ bd='#D9A441'; bg='#FBF7EE'; }
      return { text, key:String.fromCharCode(65+i), icon, iconColor:ic, pick:()=>{ if(!this.state.quizAnswered) this.setState({quizPick:i}); },
        style:`display:flex;align-items:center;gap:12px;width:100%;padding:14px 16px;border-radius:12px;border:1.5px solid ${bd};background:${bg};cursor:pointer;font-family:'Manrope';font-weight:600;font-size:13.5px;color:#33415A;text-align:left`,
        keyStyle:`width:26px;height:26px;flex:none;border-radius:7px;background:${picked?'#D9A441':'#F1F4F8'};color:${picked?'#0F2C4C':'#8494A8'};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:12px` }; });
    const quizFeedback = this.state.quizAnswered ? (this.state.quizPick===correct ? (this.state.lang==='en'?'Correct! +20 points':(this.state.lang==='es'?'Â¡Correcto! +20 puntos':'Bonne rÃ©ponse ! +20 points')) : (this.state.lang==='en'?'Not quite â€” review Module 1':'Presque â€” revois le Module 1')) : '';
    const quiz = { title:this.state.lang==='en'?'Knowledge check':'VÃ©rification des acquis', num:1, total:5, q:'Quel rÃ©gime permet gÃ©nÃ©ralement de dÃ©duire le plus de charges pour un indÃ©pendant Ã  fort chiffre d\u2019affaires ?', options:qOpts, feedback:quizFeedback, fbColor:this.state.quizAnswered?(this.state.quizPick===correct?'#1F8A5B':'#D14343'):'#8494A8' };

    // CERTIFICATES
    const certificates = [
      { title:'PrÃ©parer sa dÃ©claration IRS de A Ã  Z', date:this.state.lang==='en'?'Issued Jun 28, 2026':'DÃ©livrÃ© le 28 juin 2026', id:'ASRM-2026-0481' },
      { title:'Logiciel fiscal pro : maÃ®trise complÃ¨te', date:this.state.lang==='en'?'Issued May 12, 2026':'DÃ©livrÃ© le 12 mai 2026', id:'ASRM-2026-0377' },
      { title:'Fondamentaux de l\u2019assurance-vie', date:this.state.lang==='en'?'Issued Mar 04, 2026':'DÃ©livrÃ© le 04 mars 2026', id:'ASRM-2026-0192' },
      { title:'Introduction Ã  Obamacare', date:this.state.lang==='en'?'Issued Jan 19, 2026':'DÃ©livrÃ© le 19 janv. 2026', id:'ASRM-2026-0058' }
    ];

    // TEACHER
    const teaKpis = [
      { icon:'graduation-cap', tint:'#EAF1FB', color:'#1B5FB0', value:'1,370', label:this.state.lang==='en'?'Your students':'Tes Ã©tudiants' },
      { icon:'dollar-sign', tint:'#EAF6EF', color:'#1F8A5B', value:'$81.8k', label:this.state.lang==='en'?'Your earnings':'Tes revenus' },
      { icon:'book-open', tint:'#FBF1E1', color:'#C99A2E', value:'6', label:this.state.lang==='en'?'Courses':'Cours' },
      { icon:'star', tint:'#F3EDFB', color:'#7C5CD6', value:'4.9', label:this.state.lang==='en'?'Avg. rating':'Note moyenne' }
    ];
    const teaCoursesData = courseData.filter(c=>c.instructor==='Sarah Morel').map(c=>({ ...c, ...statusChip(c.status) }));
    const goTeaCourses = ()=>this.setState({screen:'adminCourses'});
    const questions = [
      ['Comment dÃ©clarer un revenu mixte salariÃ© + indÃ©pendant ?','Karim B.','1 h',1],
      ['Le module 4 est-il compatible avec le logiciel 2026 ?','Amina D.','3 h',4],
      ['Peut-on cumuler micro et rÃ©el la mÃªme annÃ©e ?','James C.','5 h',3],
      ['OÃ¹ trouver le modÃ¨le de facture ?','Rosa I.','1 j',1]
    ].map(([text,name,time,ai])=>({ text, name, time, initials:name.split(' ').map(w=>w[0]).join(''), avatar:av[ai] }));

    return { L, show, nav, roles, langs, me, page,
      kpis, revBars, mix, topCourses, activity, goCourses:()=>this.go('adminCourses'),
      courses, courseFilters,
      students, studentStats,
      teachers,
      salesStats, transactions, coupons,
      groups, posts, events, leaderboard,
      myCourses,
      curLesson, modules, playerCourse, playerTabs, tab, lessonMeta, resources, quiz,
      playIcon: this.state.playing?'pause':'play', togglePlay:()=>this.setState(st=>({playing:!st.playing})),
      goMyCourses:()=>this.go('stuCourses'),
      quizNext:()=>{ if(this.state.quizPick!=null) this.setState({quizAnswered:true}); },
      certificates,
      teaKpis, teaCourses:teaCoursesData, questions, goTeaCourses
    };
  }
}

