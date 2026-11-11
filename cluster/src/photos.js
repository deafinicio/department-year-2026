const photo=(id,title,caption)=>({id,title,caption,url:import.meta.env.BASE_URL+'photos/'+id+'.webp'});
const vr=[
  photo('shared-vr-scene','Сцена VR-симуляції','Ілюстрація навчальної симуляції · Сумщина та Харківщина'),
  photo('shared-vr-concept','Інформування з використанням VR','Візуалізація концепції · Сумщина та Харківщина'),
];
export const slidePhotos={
  'chernihiv-results':[
    {...photo('chernihiv-medical','Сесія для медичного персоналу','Чернігівщина · інформування працівників медичних закладів'),row:1},
    {...photo('chernihiv-higher-education','Сесія для закладу вищої освіти','Чернігівщина · робота із закладами освіти'),row:2},
  ],
  'chernihiv-achievements':[
    {...photo('chernihiv-dsns-1','Передача маркувальних знаків ДСНС','Чернігівщина · знаки «Небезпечно, міни!»'),row:1},
    {...photo('chernihiv-dsns-2','Маркувальні знаки та сигнальна стрічка','Чернігівщина · матеріали, передані ДСНС'),row:1},
  ],
  'sumy-results':[
    {...photo('sumy-safety','Класи безпеки','Сумщина · матеріали для інформування про мінну небезпеку'),row:1},
    {...photo('sumy-car','Отримання автомобіля','Сумщина · логістичне забезпечення напряму'),row:5},
    {...photo('sumy-heat','Тренінг HEAT','Сумщина · підвищення кваліфікації'),row:7},
  ],
  'sumy-achievements':[
    {...photo('sumy-theatre','«Нові пригоди Круть і Верть»','Сумщина · театральна вистава'),row:0},
    ...vr.map(p=>({...p,row:2})),
  ],
  'kharkiv-results':[
    {...photo('kharkiv-dsns','Взаємодія з ДСНС','Харківщина · до теми маркувальних знаків'),row:1},
    {...photo('kharkiv-heat','Тренінг HEAT','Харківщина · підвищення кваліфікації'),row:3},
  ],
  'kharkiv-achievements':[
    {...photo('kharkiv-studio','Цифровий освітній простір','Харківщина · візуалізація проєкту студії'),row:0},
  ],
  'kharkiv-plans':vr.map(p=>({...p,row:2})),
};
