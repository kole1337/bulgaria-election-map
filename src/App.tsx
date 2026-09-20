import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, X, Menu, Download, Globe } from 'lucide-react';
import REGIONS_RAW from './data/provinces.json';
import RESULTS_DATA from './data/results.json';

interface Party {
	id: string;
	name: string;
	abbreviation: string;
	color: string;
}

interface Election {
	id: string;
	date: string;
	label: string;
	type: 'presidential' | 'parliamentary';
	round?: 1 | 2;
}

interface President {
	id: string;
	name: string;
	candidate: string;
	runningMate: string;
}

interface RegionGeometry {
	type: string;
	id: string;
	properties: {
		name: string;
		nameLatin: string;
		code: string;
		numericId: string;
	};
	geometry: {
		type: string;
		coordinates: number[][][];
	};
}

interface SubRegion {
	abbreviation: string;
	nameBg: string;
	nameLatin: string;
}

interface RegionMeta {
	id: string;
	abbreviation: string;
	nameBg: string;
	nameLatin: string;
	hasGeometry: boolean;
	subRegions?: SubRegion[];
}

interface RegionResult {
	regionId: string;
	electionId: string;
	turnout: number;
	totalVotes: number;
	parties: {
		partyId: string;
		votes: number;
		percentage: number;
	}[];
	mps: {
		name: string;
		partyId: string;
		seatNumber: number;
	}[];
}

const PARTIES: Party[] = [
	{ id: "glas-naroden", name: 'Глас народен', abbreviation: '', color: '#800080' },
	{ id: "velichie", name: 'Величие', abbreviation: '', color: '#e83205' },
	{ id: "bulgari", name: 'Булгари', abbreviation: '', color: '#800080' },
	{ id: "moya-strana-bulgaria", name: 'Моя Страна България', abbreviation: '', color: '#800080' },
	{ id: "ima-takuv-narod", name: 'Има такъв народ', abbreviation: 'ИТН', color: '#00806d' },
	{ id: "dps-nn", name: 'ДПС - Ново Начало', abbreviation: 'ДПС-НН', color: '#090fc9' },
	{ id: "brigada", name: 'Бригада', abbreviation: '', color: '#800080' },
	{ id: "zelenite", name: 'Партия на Зелените', abbreviation: '', color: '#00800d' },
	{ id: "pravoto", name: 'Правото', abbreviation: '', color: '#800080' },
	{ id: "vazrazhdane", name: 'Възраждане', abbreviation: '', color: '#800080' },
	{ id: "aps", name: 'Алианс за Права и Свободи', abbreviation: 'АПС', color: '#002980' },
	{ id: "bns", name: 'Български Народен Съюз', abbreviation: 'БНС', color: '#800080' },
	{ id: "bsdd", name: 'БСДД', abbreviation: 'БСДД', color: '#800080' },
	{ id: "sinya-bulgaria", name: 'Синя България', abbreviation: '', color: '#800080' },
	{ id: "mech", name: 'ПП Морал Единство Чест', abbreviation: 'ПП МЕЧ', color: '#ff0000' },
	{ id: "gerb-sds", name: 'ГЕРБ-СДС', abbreviation: '', color: '#099fd2' },
	{ id: "ataka", name: 'Атака', abbreviation: '', color: '#860000' },
	{ id: "narodna-partia", name: 'Нардона Партия', abbreviation: '', color: '#800080' },
	{ id: "priyaka-democracy", name: 'Пряка Демокрация', abbreviation: '', color: '#800080' },
	{ id: "svobodni-izbirateli", name: 'Свободни Избиратели', abbreviation: '', color: '#800080' },
	{ id: "btr", name: 'БТР', abbreviation: '', color: '#800080' },
	{ id: "koi", name: 'КОЙ', abbreviation: '', color: '#800080' },
	{ id: "rusofili", name: 'Русофили за България', abbreviation: '', color: '#800080' },
	{ id: "pp-db", name: 'Продължаваме Промяната - Демократична България', abbreviation: '', color: '#ffdd00' },
	{ id: "vuzhod", name: 'Български Бъзход', abbreviation: 'БВ', color: '#800080' },
	{ id: "bsp", name: 'Българска Социалистическа Партия', abbreviation: 'БСП', color: '#d20000' },
	// Added for the 2021-11-14 parliamentary results (votes_by_region_wide.csv) - colors are
	// all placeholders until real party colors are assigned.
	{ id: "patriotichen-front", name: 'Патриотичен фронт – НФСБ, БДС Радикали и БНДС Целокупна България', abbreviation: '', color: '#800080' },
	{ id: "nod", name: 'Национално обединение на десницата', abbreviation: 'НОД', color: '#800080' },
	{ id: "bsd-evrolevitsa", name: 'Българска социалдемокрация – Евролевица', abbreviation: '', color: '#800080' },
	{ id: "onb", name: 'ПП Общество за нова България', abbreviation: '', color: '#800080' },
	{ id: "dps", name: 'Движение за права и свободи – ДПС', abbreviation: 'ДПС', color: '#800080' },
	{ id: "vmro", name: 'ВМРО – Българско национално движение', abbreviation: 'ВМРО', color: '#800080' },
	{ id: "bno", name: 'БНО', abbreviation: 'БНО', color: '#800080' },
	{ id: "volya", name: 'Воля', abbreviation: '', color: '#800080' },
	{ id: "pp", name: 'Продължаваме промяната', abbreviation: 'ПП', color: '#800080' },
	{ id: "mir", name: 'Партия МИР', abbreviation: '', color: '#800080' },
	{ id: "blagodenstvie", name: 'ПП Благоденствие – Обединение – Градивност', abbreviation: '', color: '#800080' },
	{ id: "bns-nd", name: 'Български национален съюз – НД', abbreviation: '', color: '#800080' },
	{ id: "db", name: 'Демократична България – Обединение (ДА България, ДСБ, Зелено движение)', abbreviation: 'ДБ', color: '#800080' },
	{ id: "izpravi-se-bg", name: 'Изправи се БГ! Ние идваме!', abbreviation: '', color: '#800080' },
	{ id: "bpl", name: 'Българска прогресивна линия', abbreviation: '', color: '#800080' },
	{ id: "independent-candidates", name: 'Независими кандидати', abbreviation: '', color: '#800080' }
];

const ELECTIONS: Election[] = [
	{ id: '2021-04-04', date: '2021-04-04', label: 'Април 2021', type: 'parliamentary' },
	{ id: '2021-07-11', date: '2021-07-11', label: 'Юли 2021', type: 'parliamentary' },
	{ id: '2021-11-14', date: '2021-11-14', label: 'Ноември 2021', type: 'parliamentary' },
	{ id: '2022-10-02', date: '2022-10-02', label: 'Октомври 2022', type: 'parliamentary' },
	{ id: '2023-04-02', date: '2023-04-02', label: 'Април 2023', type: 'parliamentary' },
	{ id: '2021-11-14-president', date: '2021-11-14', label: 'Ноември 2021 (1-ви тур)', type: 'presidential', round: 1 },
	{ id: '2021-11-21-president', date: '2021-11-21', label: 'Ноември 2021 (2-ри тур)', type: 'presidential', round: 2 },
];

const PRESIDENTS: President[] = [
	{ id: '1', name: 'ИК за Йоло Денев и Марио Филев', candidate: 'Йоло Димитров Денев', runningMate: 'Марио Цанков Филев' },
	{ id: '2', name: 'РУСОФИЛИ ЗА ВЪЗРАЖДАНЕ НА ОТЕЧЕСТВОТО', candidate: 'Николай Симеонов Малинов', runningMate: 'Светлана Петрова Косева' },
	{ id: '3', name: 'ИК за Росен Миленов и Иван Иванов', candidate: 'Росен Пламенов Миленов', runningMate: 'Иван Стефанов Иванов' },
	{ id: '4', name: 'ПАТРИОТИЧЕН ФРОНТ – НФСБ, БДС РАДИКАЛИ И БНДС ЦЕЛОКУПНА БЪЛГАРИЯ', candidate: 'Валери Симеонов Симеонов', runningMate: 'Цветан Венциславов Манчев' },
	{ id: '5', name: 'ВЪЗРАЖДАНЕ', candidate: 'Костадин Тодоров Костадинов', runningMate: 'Елена Цонева Гунчева' },
	{ id: '6', name: 'ИК за Румен Радев и Илияна Йотова', candidate: 'Румен Георгиев Радев', runningMate: 'Илияна Малинова Йотова' },
	{ id: '7', name: 'НАЦИОНАЛНО ОБЕДИНЕНИЕ НА ДЕСНИЦАТА', candidate: 'Горан Тасев Благоев', runningMate: 'Ивелина Колева Георгиева-Стойнова' },
	{ id: '8', name: 'БСДД – Български Съюз за Директна Демокрация', candidate: 'Благой Боянов Петревски', runningMate: 'Севина Краснодарова Хаджийска' },
	{ id: '9', name: 'ИК за Марина Малчева и Савина Луканова', candidate: 'Марина Орфей Малчева', runningMate: 'Савина Веселинова Луканова' },
	{ id: '10', name: 'БЪЛГАРСКА СОЦИАЛДЕМОКРАЦИЯ – ЕВРОЛЕВИЦА', candidate: 'Александър Трифонов Томов', runningMate: 'Лъчезар Аспарухов Аврамов' },
	{ id: '11', name: 'АТАКА', candidate: 'Волен Николов Сидеров', runningMate: 'Магдалена Ламбова Ташева' },
	{ id: '12', name: 'ИК за Боян Расате и Елена Ваташка', candidate: 'Боян Боянов Станков-Расате', runningMate: 'Елена Кирилова Ваташка' },
	{ id: '13', name: 'ПП ОБЩЕСТВО ЗА НОВА БЪЛГАРИЯ', candidate: 'Жельо Николов Желев', runningMate: 'Калин Димитров Крулев' },
	{ id: '14', name: 'ПП ГЛАС НАРОДЕН', candidate: 'Светослав Емилов Витков', runningMate: 'Веселин Асенов Белоконски' },
	{ id: '15', name: 'ИК за Анастас Герджиков и Невяна Митева', candidate: 'Анастас Георгиев Герджиков', runningMate: 'Невяна Михайлова Митева-Матеева' },
	{ id: '16', name: 'ИК за Луна Йорданова и Иглена Илиева', candidate: 'Луна Йорданова Йорданова', runningMate: 'Иглена Димитрова Илиева' },
	{ id: '17', name: 'Движение за права и свободи – ДПС', candidate: 'Мустафа Сали Карадайъ', runningMate: 'Искра Димитрова Михайлова-Копарова' },
	{ id: '18', name: 'ИК за Цвета Кирилова и Георги Тутанов', candidate: 'Цвета Кирилова Кирилова', runningMate: 'Георги Атанасов Тутанов' },
	{ id: '19', name: 'ИК за Лозан Панов и Мария Касимова–Моасе', candidate: 'Лозан Йорданов Панов', runningMate: 'Мария Хиндова Касимова-Моасе' },
	{ id: '20', name: 'ПП ПРАВОТО', candidate: 'Мария Петрова Колева', runningMate: 'Ганчо Иванов Попов' },
	{ id: '21', name: 'ВМРО – БЪЛГАРСКО НАЦИОНАЛНО ДВИЖЕНИЕ', candidate: 'Милен Василев Михов', runningMate: 'Мария Йорданова Цветкова' },
	{ id: '22', name: 'БНО', candidate: 'Георги Венелинов Георгиев', runningMate: 'Стоян Андреев Цветков' },
	{ id: '23', name: 'ВОЛЯ', candidate: 'Веселин Найденов Марешки', runningMate: 'Полина Цветославова Цанкова-Христова' },
];

// Real Bulgarian regions from GeoJSON (NUTS3 level)
// This uses actual administrative boundaries
// const REGIONS_GEOJSON_RAW = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"nuts3":"BLG"},"geometry":{"type":"Polygon","coordinates":[[[23.825,42.034],[23.807,42.027],[23.807,42.026],[23.792,42.017],[23.784,42.011],[23.782,42.005],[23.765,41.997],[23.764,41.996],[23.76,41.977],[23.76,41.976],[23.769,41.962],[23.767,41.954],[23.766,41.954],[23.755,41.929],[23.789,41.892],[23.789,41.891],[23.788,41.888],[23.78,41.875],[23.791,41.845],[23.791,41.843],[23.786,41.834],[23.833,41.815],[23.834,41.815],[23.85,41.81],[23.85,41.809],[23.862,41.794],[23.863,41.794],[23.905,41.788],[23.919,41.779],[23.926,41.768],[23.985,41.738],[24.003,41.72],[24.01,41.723],[24.018,41.706],[24.049,41.698],[24.057,41.682],[24.058,41.682],[24.074,41.673],[24.075,41.673],[24.11,41.652],[24.085,41.615],[24.103,41.586],[24.1,41.586],[24.097,41.587],[24.084,41.582],[24.084,41.579],[24.077,41.576],[24.071,41.555],[24.057,41.529],[24.06,41.522],[24.063,41.508],[24.06,41.486],[24.071,41.478],[24.048,41.451],[24.02,41.467],[24.018,41.467],[24.008,41.457],[23.981,41.44],[23.943,41.45],[23.938,41.463],[23.932,41.471],[23.909,41.479],[23.908,41.46],[23.89,41.45],[23.856,41.45],[23.832,41.437],[23.801,41.438],[23.781,41.413],[23.759,41.403],[23.693,41.404],[23.674,41.411],[23.648,41.394],[23.64,41.376],[23.596,41.381],[23.582,41.39],[23.544,41.392],[23.525,41.405],[23.523,41.405],[23.522,41.405],[23.481,41.399],[23.435,41.406],[23.418,41.399],[23.417,41.399],[23.416,41.4],[23.415,41.4],[23.414,41.401],[23.397,41.395],[23.396,41.395],[23.342,41.364],[23.322,41.4],[23.297,41.401],[23.28,41.398],[23.28,41.397],[23.258,41.383],[23.232,41.376],[23.225,41.337],[23.175,41.321],[23.135,41.32],[23.134,41.321],[23.086,41.319],[23.08,41.32],[23.056,41.326],[23.033,41.333],[23.022,41.331],[23.003,41.331],[22.983,41.336],[22.935,41.34],[22.966,41.353],[22.966,41.393],[22.967,41.393],[22.954,41.419],[22.978,41.442],[22.964,41.465],[22.961,41.492],[22.96,41.499],[22.97,41.519],[22.969,41.52],[22.971,41.546],[22.951,41.606],[22.954,41.617],[22.952,41.642],[22.982,41.647],[23.001,41.678],[23.034,41.709],[23.034,41.711],[23.014,41.759],[23.013,41.76],[22.965,41.782],[22.941,41.816],[22.943,41.83],[22.936,41.844],[22.937,41.847],[22.926,41.864],[22.901,41.878],[22.901,41.893],[22.891,41.92],[22.874,41.936],[22.875,41.978],[22.867,42.022],[22.896,42.031],[22.897,42.031],[22.908,42.047],[22.912,42.048],[22.913,42.049],[22.913,42.05],[22.9,42.065],[22.957,42.093],[22.958,42.091],[22.958,42.09],[22.959,42.087],[22.959,42.083],[22.978,42.066],[23.028,42.067],[23.028,42.062],[23.035,42.047],[23.056,42.042],[23.078,42.049],[23.089,42.056],[23.09,42.056],[23.119,42.06],[23.151,42.077],[23.152,42.077],[23.157,42.078],[23.171,42.082],[23.18,42.091],[23.203,42.095],[23.225,42.092],[23.247,42.09],[23.308,42.08],[23.32,42.067],[23.39,42.061],[23.408,42.053],[23.443,42.061],[23.471,42.076],[23.475,42.082],[23.496,42.097],[23.5,42.097],[23.572,42.086],[23.579,42.108],[23.593,42.151],[23.634,42.156],[23.654,42.175],[23.683,42.17],[23.701,42.155],[23.73,42.166],[23.744,42.184],[23.772,42.181],[23.761,42.157],[23.813,42.126],[23.794,42.122],[23.798,42.099],[23.801,42.085],[23.793,42.08],[23.796,42.054],[23.801,42.05],[23.802,42.05],[23.811,42.047],[23.812,42.047],[23.824,42.04],[23.825,42.034]]]}},{"type":"Feature","properties":{"nuts3":"LOV"},"geometry":{"type":"Polygon","coordinates":[[[24.904,43.289],[24.931,43.306],[24.977,43.297],[24.989,43.325],[25.023,43.321],[25.02,43.378],[25.028,43.38],[25.053,43.378],[25.086,43.303],[25.087,43.303],[25.107,43.286],[25.115,43.269],[25.139,43.277],[25.14,43.268],[25.14,43.267],[25.142,43.254],[25.132,43.237],[25.132,43.236],[25.13,43.234],[25.127,43.233],[25.127,43.231],[25.119,43.221],[25.118,43.22],[25.114,43.219],[25.118,43.215],[25.119,43.215],[25.118,43.214],[25.118,43.215],[25.117,43.215],[25.115,43.2],[25.112,43.191],[25.111,43.189],[25.108,43.186],[25.107,43.186],[25.077,43.178],[25.076,43.178],[25.013,43.181],[24.994,43.193],[24.995,43.194],[24.99,43.191],[24.974,43.193],[24.973,43.191],[24.957,43.188],[24.957,43.187],[24.958,43.186],[24.957,43.185],[24.956,43.185],[24.957,43.183],[24.958,43.183],[24.96,43.182],[24.963,43.182],[24.964,43.182],[24.964,43.181],[24.963,43.17],[24.962,43.17],[24.973,43.156],[24.967,43.123],[24.967,43.122],[24.939,43.115],[24.939,43.114],[24.937,43.114],[24.935,43.113],[24.936,43.114],[24.928,43.114],[24.918,43.104],[24.926,43.077],[24.926,43.076],[24.925,43.076],[24.923,43.072],[24.922,43.072],[24.919,43.067],[24.937,43.049],[24.936,43.049],[24.944,43.037],[24.944,43.036],[24.945,43.036],[24.952,43.034],[24.945,43.029],[24.931,43.025],[24.932,43.025],[24.921,43.021],[24.91,43.021],[24.897,43.019],[24.878,43.016],[24.878,43.015],[24.878,43.012],[24.871,42.989],[24.872,42.983],[24.872,42.982],[24.872,42.981],[24.873,42.973],[24.87,42.965],[24.872,42.952],[24.871,42.946],[24.884,42.938],[24.884,42.937],[24.886,42.925],[24.88,42.913],[24.881,42.912],[24.88,42.912],[24.88,42.908],[24.884,42.897],[24.907,42.877],[24.909,42.874],[24.932,42.878],[24.932,42.879],[24.938,42.882],[24.941,42.884],[24.966,42.878],[24.967,42.878],[24.968,42.878],[24.979,42.854],[24.979,42.841],[24.992,42.821],[24.997,42.816],[25.008,42.809],[25.015,42.767],[25.014,42.766],[25.013,42.765],[25.009,42.76],[25.007,42.76],[25,42.758],[24.999,42.753],[25.004,42.755],[25.005,42.755],[25.014,42.754],[25.015,42.754],[25.015,42.749],[25.014,42.748],[25.015,42.748],[25.014,42.747],[25.007,42.747],[25.008,42.748],[25,42.749],[24.994,42.752],[24.987,42.749],[24.982,42.748],[24.982,42.749],[24.981,42.749],[24.982,42.748],[24.985,42.747],[24.985,42.746],[25.007,42.738],[24.939,42.728],[24.915,42.716],[24.892,42.722],[24.867,42.722],[24.837,42.728],[24.78,42.716],[24.78,42.715],[24.756,42.709],[24.755,42.709],[24.72,42.715],[24.686,42.722],[24.674,42.727],[24.66,42.744],[24.652,42.749],[24.641,42.769],[24.622,42.778],[24.606,42.781],[24.599,42.781],[24.581,42.788],[24.559,42.79],[24.547,42.788],[24.502,42.792],[24.494,42.794],[24.494,42.793],[24.477,42.758],[24.464,42.75],[24.423,42.754],[24.386,42.75],[24.334,42.75],[24.286,42.773],[24.245,42.775],[24.229,42.767],[24.203,42.763],[24.18,42.766],[24.18,42.767],[24.128,42.775],[24.128,42.783],[24.15,42.788],[24.2,42.82],[24.178,42.814],[24.167,42.819],[24.168,42.819],[24.192,42.834],[24.175,42.846],[24.175,42.847],[24.174,42.847],[24.171,42.865],[24.171,42.869],[24.171,42.888],[24.177,42.9],[24.173,42.901],[24.172,42.908],[24.173,42.908],[24.155,42.935],[24.133,42.931],[24.089,42.942],[24.09,42.942],[24.086,42.952],[24.086,42.953],[24.072,42.959],[24.065,42.981],[24.077,42.984],[24.068,42.994],[24.048,43.025],[24.047,43.025],[24.042,43.03],[24.042,43.031],[24.045,43.05],[24.045,43.051],[24.044,43.06],[24.036,43.062],[24.035,43.062],[24.013,43.06],[24.012,43.06],[23.972,43.062],[23.971,43.062],[23.971,43.063],[23.962,43.112],[23.964,43.116],[23.966,43.116],[23.97,43.114],[23.971,43.114],[24,43.104],[24.028,43.108],[24.029,43.108],[24.026,43.115],[24.025,43.117],[24.016,43.137],[24.016,43.138],[24.026,43.151],[24.026,43.152],[24.026,43.153],[24.025,43.155],[24.026,43.155],[24.019,43.18],[24.02,43.18],[24.033,43.194],[24.032,43.206],[24.078,43.232],[24.092,43.23],[24.117,43.241],[24.149,43.244],[24.166,43.236],[24.178,43.238],[24.219,43.229],[24.231,43.227],[24.255,43.224],[24.262,43.228],[24.287,43.237],[24.306,43.238],[24.327,43.256],[24.386,43.278],[24.387,43.278],[24.388,43.277],[24.39,43.275],[24.392,43.274],[24.396,43.267],[24.395,43.266],[24.428,43.248],[24.443,43.22],[24.444,43.22],[24.453,43.219],[24.461,43.217],[24.498,43.224],[24.498,43.223],[24.535,43.213],[24.539,43.212],[24.578,43.204],[24.596,43.209],[24.597,43.209],[24.612,43.217],[24.628,43.223],[24.639,43.223],[24.631,43.226],[24.631,43.227],[24.64,43.238],[24.656,43.251],[24.653,43.279],[24.683,43.253],[24.684,43.253],[24.684,43.27],[24.741,43.296],[24.742,43.305],[24.755,43.313],[24.811,43.317],[24.812,43.317],[24.814,43.316],[24.816,43.315],[24.833,43.304],[24.899,43.297],[24.904,43.289]]]}},{"type":"Feature","properties":{"nuts3":"DOB"},"geometry":{"type":"Polygon","coordinates":[[[27.504,43.84],[27.504,43.841],[27.502,43.845],[27.513,43.85],[27.514,43.85],[27.524,43.849],[27.529,43.875],[27.53,43.875],[27.531,43.889],[27.543,43.918],[27.546,43.918],[27.576,43.911],[27.576,43.91],[27.596,43.892],[27.631,43.91],[27.631,43.918],[27.636,43.932],[27.637,43.944],[27.654,43.951],[27.653,43.951],[27.659,43.979],[27.696,43.987],[27.724,43.956],[27.725,43.956],[27.756,43.958],[27.819,43.964],[27.833,43.965],[27.869,43.981],[27.917,44.008],[27.944,43.985],[27.95,43.958],[27.974,43.905],[27.984,43.875],[27.994,43.843],[28.033,43.83],[28.12,43.796],[28.173,43.779],[28.22,43.764],[28.277,43.756],[28.377,43.747],[28.446,43.734],[28.559,43.738],[28.573,43.723],[28.57,43.698],[28.565,43.675],[28.572,43.628],[28.571,43.592],[28.571,43.591],[28.577,43.58],[28.578,43.58],[28.607,43.543],[28.602,43.521],[28.602,43.52],[28.597,43.511],[28.587,43.498],[28.586,43.496],[28.586,43.495],[28.585,43.492],[28.586,43.492],[28.586,43.491],[28.576,43.478],[28.575,43.478],[28.571,43.473],[28.57,43.471],[28.569,43.471],[28.563,43.464],[28.559,43.455],[28.559,43.454],[28.556,43.449],[28.555,43.449],[28.551,43.444],[28.549,43.441],[28.546,43.439],[28.53,43.424],[28.529,43.424],[28.528,43.423],[28.514,43.415],[28.51,43.415],[28.503,43.412],[28.502,43.412],[28.496,43.408],[28.472,43.383],[28.47,43.381],[28.463,43.369],[28.441,43.382],[28.379,43.406],[28.379,43.407],[28.359,43.411],[28.354,43.413],[28.35,43.411],[28.335,43.416],[28.285,43.412],[28.28,43.413],[28.251,43.406],[28.245,43.403],[28.243,43.405],[28.237,43.403],[28.237,43.404],[28.233,43.404],[28.231,43.404],[28.231,43.403],[28.222,43.399],[28.208,43.399],[28.177,43.398],[28.175,43.4],[28.171,43.403],[28.168,43.403],[28.168,43.404],[28.165,43.405],[28.161,43.405],[28.154,43.405],[28.149,43.404],[28.105,43.381],[28.105,43.38],[28.082,43.363],[28.068,43.335],[28.066,43.335],[28.055,43.319],[28.021,43.341],[28.022,43.354],[28.009,43.375],[27.986,43.388],[27.986,43.389],[27.937,43.401],[27.914,43.386],[27.913,43.386],[27.9,43.374],[27.901,43.373],[27.902,43.372],[27.898,43.37],[27.863,43.36],[27.84,43.379],[27.828,43.404],[27.805,43.405],[27.784,43.422],[27.784,43.423],[27.775,43.428],[27.774,43.428],[27.76,43.431],[27.725,43.465],[27.724,43.465],[27.702,43.48],[27.701,43.48],[27.675,43.476],[27.646,43.484],[27.636,43.493],[27.644,43.503],[27.616,43.527],[27.59,43.53],[27.581,43.511],[27.578,43.504],[27.541,43.495],[27.547,43.489],[27.526,43.495],[27.508,43.497],[27.489,43.52],[27.488,43.52],[27.484,43.552],[27.474,43.57],[27.44,43.585],[27.429,43.6],[27.434,43.608],[27.412,43.605],[27.407,43.613],[27.347,43.599],[27.303,43.59],[27.295,43.624],[27.27,43.646],[27.239,43.644],[27.238,43.644],[27.237,43.644],[27.22,43.665],[27.222,43.692],[27.221,43.692],[27.2,43.705],[27.199,43.705],[27.209,43.721],[27.209,43.743],[27.21,43.743],[27.222,43.754],[27.229,43.747],[27.248,43.77],[27.258,43.772],[27.285,43.801],[27.289,43.799],[27.293,43.801],[27.295,43.805],[27.318,43.804],[27.317,43.808],[27.327,43.811],[27.32,43.808],[27.351,43.807],[27.357,43.815],[27.373,43.818],[27.373,43.816],[27.395,43.853],[27.419,43.848],[27.45,43.87],[27.45,43.871],[27.451,43.871],[27.46,43.86],[27.464,43.859],[27.485,43.84],[27.504,43.84]]]}}]};

// Region metadata: standard 28-province numbering (ISO 3166-2:BG style).
// Sofia (city) and Plovdiv each have a single map polygon, but are split into
// multiple electoral districts (МИР) for elections - those are listed under
// `subRegions` and are accessible from the region panel rather than the map.
// "Abroad" (Извън страната) has no polygon at all and is reached separately.
const REGIONS: RegionMeta[] = [
	{ id: '01', abbreviation: 'BLG', nameBg: 'Благоевград', nameLatin: 'Blagoevgrad', hasGeometry: true },
	{ id: '02', abbreviation: 'BGS', nameBg: 'Бургас', nameLatin: 'Burgas', hasGeometry: true },
	{ id: '03', abbreviation: 'VAR', nameBg: 'Варна', nameLatin: 'Varna', hasGeometry: true },
	{ id: '04', abbreviation: 'VTR', nameBg: 'Велико Търново', nameLatin: 'Veliko Tarnovo', hasGeometry: true },
	{ id: '05', abbreviation: 'VID', nameBg: 'Видин', nameLatin: 'Vidin', hasGeometry: true },
	{ id: '06', abbreviation: 'VRC', nameBg: 'Враца', nameLatin: 'Vratsa', hasGeometry: true },
	{ id: '07', abbreviation: 'GAB', nameBg: 'Габрово', nameLatin: 'Gabrovo', hasGeometry: true },
	{ id: '08', abbreviation: 'DOB', nameBg: 'Добрич', nameLatin: 'Dobrich', hasGeometry: true },
	{ id: '09', abbreviation: 'KRZ', nameBg: 'Кърджали', nameLatin: 'Kardzhali', hasGeometry: true },
	{ id: '10', abbreviation: 'KNL', nameBg: 'Кюстендил', nameLatin: 'Kyustendil', hasGeometry: true },
	{ id: '11', abbreviation: 'LOV', nameBg: 'Ловеч', nameLatin: 'Lovech', hasGeometry: true },
	{ id: '12', abbreviation: 'MON', nameBg: 'Монтана', nameLatin: 'Montana', hasGeometry: true },
	{ id: '13', abbreviation: 'PAZ', nameBg: 'Пазарджик', nameLatin: 'Pazardzhik', hasGeometry: true },
	{ id: '14', abbreviation: 'PER', nameBg: 'Перник', nameLatin: 'Pernik', hasGeometry: true },
	{ id: '15', abbreviation: 'PVN', nameBg: 'Плевен', nameLatin: 'Pleven', hasGeometry: true },
	{
		id: '16', abbreviation: 'PDV', nameBg: 'Пловдив', nameLatin: 'Plovdiv', hasGeometry: true,
		subRegions: [
			{ abbreviation: 'PDG', nameBg: 'Пловдив град', nameLatin: 'Plovdiv (city)' },
			{ abbreviation: 'PDO', nameBg: 'Пловдив област', nameLatin: 'Plovdiv (province)' },
		]
	},
	{ id: '17', abbreviation: 'RAZ', nameBg: 'Разград', nameLatin: 'Razgrad', hasGeometry: true },
	{ id: '18', abbreviation: 'RSE', nameBg: 'Русе', nameLatin: 'Ruse', hasGeometry: true },
	{ id: '19', abbreviation: 'SLS', nameBg: 'Силистра', nameLatin: 'Silistra', hasGeometry: true },
	{ id: '20', abbreviation: 'SLV', nameBg: 'Сливен', nameLatin: 'Sliven', hasGeometry: true },
	{ id: '21', abbreviation: 'SML', nameBg: 'Смолян', nameLatin: 'Smolyan', hasGeometry: true },
	{
		id: '22', abbreviation: 'SOF', nameBg: 'София', nameLatin: 'Sofia (city)', hasGeometry: true,
		subRegions: [
			{ abbreviation: 'SOF23', nameBg: 'София 23 ИР', nameLatin: 'Sofia 23' },
			{ abbreviation: 'SOF24', nameBg: 'София 24 ИР', nameLatin: 'Sofia 24' },
			{ abbreviation: 'SOF25', nameBg: 'София 25 ИР', nameLatin: 'Sofia 25' },
		]
	},
	{ id: '23', abbreviation: 'SFO', nameBg: 'София (област)', nameLatin: 'Sofia (Province)', hasGeometry: true },
	{ id: '24', abbreviation: 'SZR', nameBg: 'Стара Загора', nameLatin: 'Stara Zagora', hasGeometry: true },
	{ id: '25', abbreviation: 'TGV', nameBg: 'Търговище', nameLatin: 'Targovishte', hasGeometry: true },
	{ id: '26', abbreviation: 'HKV', nameBg: 'Хасково', nameLatin: 'Haskovo', hasGeometry: true },
	{ id: '27', abbreviation: 'SHU', nameBg: 'Шумен', nameLatin: 'Shumen', hasGeometry: true },
	{ id: '28', abbreviation: 'JAM', nameBg: 'Ямбол', nameLatin: 'Yambol', hasGeometry: true },
	{ id: '29', abbreviation: 'ABR', nameBg: 'Извън страната', nameLatin: 'Abroad', hasGeometry: false },
];

const REGIONS_BY_ABBR: Record<string, RegionMeta> = Object.fromEntries(
	REGIONS.map(region => [region.abbreviation, region])
);

const ABROAD_ABBREVIATION = 'ABR';

// Convert raw GeoJSON, enriching each feature with its region metadata
const REGIONS_GEOJSON: RegionGeometry[] = REGIONS_RAW.features.map((feature: any) => {
	const meta = REGIONS_BY_ABBR[feature.properties.nuts3];
	return {
		type: 'Feature',
		id: feature.properties.nuts3,
		properties: {
			name: meta?.nameBg || feature.properties.nuts3,
			nameLatin: meta?.nameLatin || feature.properties.nuts3,
			code: feature.properties.nuts3,
			numericId: meta?.id || ''
		},
		geometry: feature.geometry
	};
});

// const [geoData, setGeoData] = useState<any>(null);

// useEffect(() => {
//   fetch('/provinces.geojson')
//     .then(res => res.json())
//     .then(data => setGeoData(data));
// }, []);

// Generate dummy results
// const generateResults = (): RegionResult[] => {
//   const results: RegionResult[] = [];

//   REGIONS_GEOJSON.forEach(region => {
//     ELECTIONS.forEach(election => {
//       const totalVotes = Math.floor(Math.random() * 200000) + 100000;
//       const turnout = Math.random() * 30 + 50; // 50-80%

//       // Generate party votes
//       let remainingVotes = totalVotes;
//       const partyResults = PARTIES.map((party, idx) => {
//         const isLast = idx === PARTIES.length - 1;
//         const votes = isLast ? remainingVotes : Math.floor(Math.random() * remainingVotes * 0.4);
//         remainingVotes -= votes;
//         return {
//           partyId: party.id,
//           votes,
//           percentage: 0 // Will calculate after
//         };
//       }).sort((a, b) => b.votes - a.votes);

//       // Calculate percentages
//       partyResults.forEach(pr => {
//         pr.percentage = (pr.votes / totalVotes) * 100;
//       });

//       // Generate MPs (top 3 parties get seats)
//       const mps = [];
//       partyResults.slice(0, 3).forEach((pr, idx) => {
//         const seats = idx === 0 ? 5 : idx === 1 ? 3 : 2;
//         for (let i = 0; i < seats; i++) {
//           mps.push({
//             name: `Депутат ${mps.length + 1}`,
//             partyId: pr.partyId,
//             seatNumber: mps.length + 1
//           });
//         }
//       });

//       results.push({
//         regionId: region.id,
//         electionId: election.id,
//         turnout,
//         totalVotes,
//         parties: partyResults,
//         mps
//       });
//     });
//   });

//   return results;
// };

const RESULTS: RegionResult[] = RESULTS_DATA;

const formatNumber = (num: number): string => {
	return new Intl.NumberFormat('bg-BG').format(Math.round(num));
};

const formatPercent = (num: number): string => {
	return `${num.toFixed(2)}%`;
};

const getWinnerColor = (regionId: string, electionId: string): { color: string; opacity: number } => {
	const result = RESULTS.find(r => r.regionId === regionId && r.electionId === electionId);
	if (!result || result.parties.length === 0) return { color: '#cccccc', opacity: 0.3 };

	const winner = result.parties[0];
	const runnerUp = result.parties[1];
	const party = PARTIES.find(p => p.id === winner.partyId);

	if (!party) return { color: '#cccccc', opacity: 0.3 };

	const margin = winner.percentage - (runnerUp?.percentage || 0);
	const opacity = 0.55 + (Math.min(margin, 30) / 30) * 0.45;

	return { color: party.color, opacity };
};

const getQueryParam = (key: string): string | null => {
	if (typeof window === 'undefined') return null;
	const params = new URLSearchParams(window.location.search);
	return params.get(key);
};

const setQueryParams = (election: string, region: string | null) => {
	if (typeof window === 'undefined') return;
	const params = new URLSearchParams();
	params.set('election', election);
	if (region) params.set('region', region);
	const newUrl = `${window.location.pathname}?${params.toString()}`;
	window.history.pushState({}, '', newUrl);
};

const ElectionTypeToggle: React.FC<{
	activeType: 'presidential' | 'parliamentary';
	onChange: (type: 'presidential' | 'parliamentary') => void;
}> = ({ activeType, onChange }) => {
	return (
		<div className="bg-white border-b border-gray-200 px-4 py-2">
			<div className="flex items-center gap-2">
				<span className="text-sm font-medium text-gray-700 whitespace-nowrap">Вид избори:</span>
				<div className="flex gap-1">
					<button
						onClick={() => onChange('parliamentary')}
						className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${activeType === 'parliamentary'
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						aria-pressed={activeType === 'parliamentary'}
					>
						Парламентарни
					</button>
					<button
						onClick={() => onChange('presidential')}
						className={`px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${activeType === 'presidential'
								? 'bg-blue-600 text-white'
								: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
							}`}
						aria-pressed={activeType === 'presidential'}
					>
						Президентски
					</button>
				</div>
			</div>
		</div>
	);
};

const Timeline: React.FC<{
	elections: Election[];
	activeId: string;
	onChange: (id: string) => void;
}> = ({ elections, activeId, onChange }) => {
	return (
		<div className="bg-white border-b border-gray-200 px-4 py-3">
			<div className="flex items-center gap-2 overflow-x-auto">
				<span className="text-sm font-medium text-gray-700 whitespace-nowrap">Избори:</span>
				<div className="flex gap-1">
					{elections.map(election => (
						<button
							key={election.id}
							onClick={() => onChange(election.id)}
							className={`px-3 py-1.5 rounded text-sm font-medium transition-colors whitespace-nowrap
              ${activeId === election.id
									? 'bg-blue-600 text-white'
									: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
								}`}
							aria-pressed={activeId === election.id}
							title={`${election.label} (${election.date})`}
						>
							{election.label}
						</button>
					))}
				</div>
			</div>
		</div>
	);
};

const MapView: React.FC<{
	regions: RegionGeometry[];
	activeElectionId: string;
	activeRegionId: string | null;
	onRegionClick: (regionId: string) => void;
}> = ({ regions, activeElectionId, activeRegionId, onRegionClick }) => {
	const [hoveredRegion, setHoveredRegion] = useState<string | null>(null);
	const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

	const viewBox = useMemo(() => {
		let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

		if (!regions || regions.length === 0) return "22 -44 7 3";

		regions.forEach(region => {
			const allPoints = region.geometry.type === 'MultiPolygon'
				? region.geometry.coordinates.flat(2)
				: region.geometry.coordinates.flat(1);

			allPoints.forEach(([x, y]) => {
				const transformedY = -y;
				minX = Math.min(minX, x);
				minY = Math.min(minY, transformedY);
				maxX = Math.max(maxX, x);
				maxY = Math.max(maxY, transformedY);
			});
		});

		const padding = 0.2;
		const width = maxX - minX + padding * 2;
		const height = maxY - minY + padding * 2;

		return `${minX - padding} ${minY - padding} ${width} ${height}`;
	}, [regions]);

	const getPathData = (geometry: any) => {
		// We multiply Y by -1 to account for SVG's inverted Y-axis
		const transformY = (y: number) => -y;

		if (geometry.type === 'Polygon') {
			return geometry.coordinates
				.map((ring: any) => ring.map((c: any, i: number) =>
					`${i === 0 ? 'M' : 'L'} ${c[0]} ${transformY(c[1])}`
				).join(' ') + ' Z')
				.join(' ');
		} else if (geometry.type === 'MultiPolygon') {
			return geometry.coordinates
				.map((polygon: any) =>
					polygon.map((ring: any) => ring.map((c: any, i: number) =>
						`${i === 0 ? 'M' : 'L'} ${c[0]} ${transformY(c[1])}`
					).join(' ') + ' Z').join(' ')
				).join(' ');
		}
		return '';
	};

	const handleMouseMove = (e: React.MouseEvent, regionId: string) => {
		setHoveredRegion(regionId);
		setTooltipPos({ x: e.clientX, y: e.clientY });
	};

	const tooltipData = useMemo(() => {
		if (!hoveredRegion) return null;
		const region = regions.find(r => r.id === hoveredRegion);
		// Find results for the hovered region
		const result = RESULTS.find(r => r.regionId === hoveredRegion && r.electionId === activeElectionId);
		if (!region || !result) return null;

		const top3 = result.parties.slice(0, 3);
		const maxPct = top3[0]?.percentage || 100;

		return {
			name: region.properties.name,
			parties: top3.map(p => ({
				...p,
				party: PARTIES.find(party => party.id === p.partyId)!,
				barWidth: (p.percentage / maxPct) * 100
			}))
		};
	}, [hoveredRegion, activeElectionId, regions]);

	return (
		<div className="relative w-full h-full bg-gray-50">
			<svg viewBox={viewBox} className="w-full h-full" role="img">
				{regions.map(region => {
					const { color, opacity } = getWinnerColor(region.id, activeElectionId);
					const isActive = activeRegionId === region.id;
					const isHovered = hoveredRegion === region.id;

					return (
						<path
							key={region.id}
							d={getPathData(region.geometry)}
							fill={color}
							fillOpacity={opacity}
							stroke={isActive ? '#1e40af' : isHovered ? '#3b82f6' : '#94a3b8'}
							strokeWidth={isActive ? 0.05 : isHovered ? 0.03 : 0.01}
							className="cursor-pointer transition-all hover:brightness-95"
							onClick={() => onRegionClick(region.id)}
							onMouseEnter={(e) => handleMouseMove(e, region.id)}
							onMouseMove={(e) => handleMouseMove(e, region.id)}
							onMouseLeave={() => setHoveredRegion(null)}
						/>
					);
				})}
			</svg>

			{/* --- THIS IS THE POP-OUT TOOLTIP BLOCK --- */}
			{tooltipData && (
				<div
					className="fixed z-50 bg-white shadow-lg rounded-lg p-3 pointer-events-none border border-gray-200"
					style={{
						left: tooltipPos.x + 15,
						top: tooltipPos.y + 15,
						maxWidth: '250px'
					}}
				>
					<div className="font-semibold text-sm mb-2">{tooltipData.name}</div>
					<div className="space-y-1">
						{tooltipData.parties.map(p => (
							<div key={p.partyId} className="flex items-center gap-2 text-xs">
								<div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.party.color }} />
								<div className="flex-1 min-w-0">
									<div className="flex justify-between gap-2 mb-0.5">
										<span className="truncate font-medium">{p.party.abbreviation}</span>
										<span className="font-semibold">{formatPercent(p.percentage)}</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-1.5">
										<div className="h-1.5 rounded-full" style={{ width: `${p.barWidth}%`, backgroundColor: p.party.color }} />
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	);
};

const RegionPanel: React.FC<{
	regionId: string;
	electionId: string;
	onClose: () => void;
	isMobile: boolean;
}> = ({ regionId, electionId, onClose, isMobile }) => {
	const [selectedSubRegion, setSelectedSubRegion] = useState<string | null>(null);
	const [showSubRegions, setShowSubRegions] = useState(false);

	useEffect(() => {
		setSelectedSubRegion(null);
		setShowSubRegions(false);
	}, [regionId]);

	const regionMeta = REGIONS_BY_ABBR[regionId];
	const election = ELECTIONS.find(e => e.id === electionId);

	if (!regionMeta || !election) return null;

	const activeSubRegion = selectedSubRegion
		? regionMeta.subRegions?.find(s => s.abbreviation === selectedSubRegion)
		: undefined;
	const effectiveRegionId = selectedSubRegion || regionId;
	const displayName = activeSubRegion?.nameBg || regionMeta.nameBg;

	const result = RESULTS.find(r => r.regionId === effectiveRegionId && r.electionId === electionId);
	const winner = result?.parties[0];
	const winnerParty = winner ? PARTIES.find(p => p.id === winner.partyId) : undefined;

	const content = (
		<div className="flex flex-col h-full">
			<div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
				<div>
					<h2 className="text-lg font-bold text-gray-900">{displayName}</h2>
					<p className="text-sm text-gray-600">{election.label}</p>
					{!activeSubRegion && (
						<p className="text-xs text-gray-400">{regionMeta.abbreviation} · №{regionMeta.id}</p>
					)}
				</div>
				<button
					onClick={onClose}
					className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
					aria-label="Затвори"
				>
					<X className="w-5 h-5" />
				</button>
			</div>

			{regionMeta.subRegions && (
				<div className="border-b border-gray-200 bg-gray-50">
					<button
						onClick={() => setShowSubRegions(v => !v)}
						className="w-full flex items-center justify-between px-4 py-2 text-sm font-medium text-blue-700 hover:bg-gray-100 transition-colors"
						aria-expanded={showSubRegions}
					>
						<span>Избирателни райони</span>
						<span>{showSubRegions ? '▲' : '▼'}</span>
					</button>
					{showSubRegions && (
						<div className="px-4 pb-3 flex flex-wrap gap-2">
							<button
								onClick={() => setSelectedSubRegion(null)}
								className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                  ${!selectedSubRegion ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
							>
								Целият регион
							</button>
							{regionMeta.subRegions.map(sub => (
								<button
									key={sub.abbreviation}
									onClick={() => setSelectedSubRegion(sub.abbreviation)}
									className={`px-3 py-1.5 rounded text-xs font-medium transition-colors
                    ${selectedSubRegion === sub.abbreviation ? 'bg-blue-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
								>
									{sub.nameBg}
								</button>
							))}
						</div>
					)}
				</div>
			)}

			<div className="flex-1 overflow-y-auto p-4">
				{!result ? (
					<div className="text-sm text-gray-500 text-center py-8">
						Няма налични данни за {displayName} ({election.label}).
					</div>
				) : (
					<>
						<div className="grid grid-cols-2 gap-4 mb-6">
							<div className="bg-blue-50 rounded-lg p-3">
								<div className="text-xs text-gray-600 mb-1">Избирателна активност</div>
								<div className="text-2xl font-bold text-blue-900">{formatPercent(result.turnout)}</div>
							</div>
							<div className="bg-gray-50 rounded-lg p-3">
								<div className="text-xs text-gray-600 mb-1">Гласували общо</div>
								<div className="text-2xl font-bold text-gray-900">{formatNumber(result.totalVotes)}</div>
							</div>
						</div>

						{winnerParty && winner && (
							<div className="mb-6 p-3 rounded-lg" style={{ backgroundColor: `${winnerParty.color}15` }}>
								<div className="text-xs text-gray-600 mb-1">Победител</div>
								<div className="flex items-center gap-2">
									<div className="w-4 h-4 rounded" style={{ backgroundColor: winnerParty.color }} />
									<span className="font-bold text-gray-900">{winnerParty.name}</span>
									<span className="ml-auto font-semibold">{formatPercent(winner.percentage)}</span>
								</div>
							</div>
						)}

						<div className="mb-6">
							<h3 className="text-sm font-bold text-gray-900 mb-3">Резултати по партии</h3>
							<div className="space-y-3">
								{result.parties.map(p => {
									const party = PARTIES.find(party => party.id === p.partyId);
									if (!party) return null;

									const barWidth = (p.percentage / result.parties[0].percentage) * 100;

									return (
										<div key={p.partyId} className="border border-gray-200 rounded-lg p-3">
											<div className="flex items-start gap-3 mb-2">
												<div className="w-4 h-4 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: party.color }} />
												<div className="flex-1 min-w-0">
													<div className="font-semibold text-sm text-gray-900">{party.name}</div>
													<div className="text-xs text-gray-600">{party.abbreviation}</div>
												</div>
											</div>
											<div className="flex justify-between items-baseline mb-1">
												<span className="text-xs text-gray-600">Гласове:</span>
												<span className="font-bold text-gray-900">{formatNumber(p.votes)}</span>
											</div>
											<div className="flex justify-between items-baseline mb-2">
												<span className="text-xs text-gray-600">Процент:</span>
												<span className="font-bold text-gray-900">{formatPercent(p.percentage)}</span>
											</div>
											<div className="w-full bg-gray-200 rounded-full h-2">
												<div
													className="h-2 rounded-full transition-all"
													style={{
														width: `${barWidth}%`,
														backgroundColor: party.color
													}}
												/>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						<div>
							<h3 className="text-sm font-bold text-gray-900 mb-3">Избрани депутати ({result.mps.length})</h3>
							<div className="grid gap-2">
								{result.mps.map((mp, idx) => {
									const party = PARTIES.find(p => p.id === mp.partyId);
									if (!party) return null;

									return (
										<div key={idx} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
											<div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: party.color }} />
											<span className="text-sm text-gray-900">{mp.name}</span>
											<span className="ml-auto text-xs text-gray-600">Място {mp.seatNumber}</span>
										</div>
									);
								})}
							</div>
						</div>
					</>
				)}
			</div>
		</div>
	);

	if (isMobile) {
		return (
			<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
				<div className="bg-white w-full h-[90vh] sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg shadow-xl flex flex-col">
					{content}
				</div>
			</div>
		);
	}

	return (
		<div className="w-96 border-l border-gray-200 bg-white flex flex-col h-full">
			{content}
		</div>
	);
};

const Legend: React.FC<{ parties: Party[] }> = ({ parties }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<div className="absolute bottom-4 left-4 bg-white shadow-lg rounded-lg border border-gray-200 z-10">
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex items-center gap-2 p-3 w-full hover:bg-gray-50 transition-colors"
				aria-expanded={isExpanded}
			>
				<BarChart3 className="w-4 h-4 text-gray-600" />
				<span className="text-sm font-medium text-gray-900">Легенда</span>
			</button>

			{isExpanded && (
				<div className="border-t border-gray-200 p-3 space-y-2 max-w-xs">
					{parties.map(party => (
						<div key={party.id} className="flex items-center gap-2">
							<div className="w-4 h-4 rounded flex-shrink-0" style={{ backgroundColor: party.color }} />
							<span className="text-xs text-gray-900">{party.name}</span>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

// ============================================================================
// MAIN APP
// ============================================================================

const App: React.FC = () => {
	const [activeElectionId, setActiveElectionId] = useState<string>(() => {
		return getQueryParam('election') || ELECTIONS[ELECTIONS.length - 1].id;
	});

	const [activeElectionType, setActiveElectionType] = useState<'presidential' | 'parliamentary'>(() => {
		const initialId = getQueryParam('election') || ELECTIONS[ELECTIONS.length - 1].id;
		return ELECTIONS.find(e => e.id === initialId)?.type || 'parliamentary';
	});

	const [activeRegionId, setActiveRegionId] = useState<string | null>(() => {
		return getQueryParam('region');
	});

	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			const width = window.innerWidth;
			setIsMobile(width < 768);
			// Auto-hide sidebar on mobile
			if (width < 768) {
				setSidebarOpen(false);
			}
		};

		checkMobile();
		window.addEventListener('resize', checkMobile);
		return () => window.removeEventListener('resize', checkMobile);
	}, []);

	useEffect(() => {
		setQueryParams(activeElectionId, activeRegionId);
	}, [activeElectionId, activeRegionId]);

	const filteredElections = useMemo(() => {
		return ELECTIONS.filter(e => e.type === activeElectionType);
	}, [activeElectionType]);

	const handleElectionChange = useCallback((electionId: string) => {
		setActiveElectionId(electionId);
	}, []);

	const handleElectionTypeChange = useCallback((type: 'presidential' | 'parliamentary') => {
		setActiveElectionType(type);
		const electionsOfType = ELECTIONS.filter(e => e.type === type);
		if (electionsOfType.length > 0) {
			setActiveElectionId(electionsOfType[electionsOfType.length - 1].id);
		}
	}, []);

	const handleRegionClick = useCallback((regionId: string) => {
		setActiveRegionId(regionId);
		// On desktop, always show sidebar; on mobile, modal will appear automatically
		if (window.innerWidth >= 768) {
			setSidebarOpen(true);
		}
	}, []);

	const handleClosePanel = useCallback(() => {
		setActiveRegionId(null);
		setQueryParams(activeElectionId, null);
	}, [activeElectionId]);

	return (
		<div className="flex flex-col h-screen bg-gray-100">
			<header className="bg-blue-600 text-white px-4 py-3 shadow-md">
				<div className="flex items-center justify-between">
					<h1 className="text-xl font-bold">Избирателни резултати - България</h1>
					{!isMobile && activeRegionId && (
						<button
							onClick={() => setSidebarOpen(!sidebarOpen)}
							className="p-2 hover:bg-blue-700 rounded transition-colors"
							aria-label={sidebarOpen ? 'Скрий панела' : 'Покажи панела'}
						>
							<Menu className="w-5 h-5" />
						</button>
					)}
				</div>
			</header>

			<ElectionTypeToggle
				activeType={activeElectionType}
				onChange={handleElectionTypeChange}
			/>

			<Timeline
				elections={filteredElections}
				activeId={activeElectionId}
				onChange={handleElectionChange}
			/>

			<div className="flex-1 flex overflow-hidden">
				<div className="flex-1 relative">
					<MapView
						regions={REGIONS_GEOJSON}
						activeElectionId={activeElectionId}
						activeRegionId={activeRegionId}
						onRegionClick={handleRegionClick}
					/>
					<Legend parties={PARTIES} />
					<button
						onClick={() => handleRegionClick(ABROAD_ABBREVIATION)}
						className="absolute top-4 right-4 bg-white shadow-lg rounded-lg border border-gray-200 px-3 py-2 flex items-center gap-2 hover:bg-gray-50 transition-colors z-10"
						title="Извън страната"
					>
						<Globe className="w-4 h-4 text-gray-600" />
						<span className="text-xs font-medium text-gray-900">Извън страната</span>
					</button>
				</div>

				{activeRegionId && !isMobile && sidebarOpen && (
					<RegionPanel
						regionId={activeRegionId}
						electionId={activeElectionId}
						onClose={handleClosePanel}
						isMobile={false}
					/>
				)}
			</div>

			{activeRegionId && isMobile && (
				<RegionPanel
					regionId={activeRegionId}
					electionId={activeElectionId}
					onClose={handleClosePanel}
					isMobile={true}
				/>
			)}
		</div>
	);
};

export default App;