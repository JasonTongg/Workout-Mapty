'use strict';

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class workout{
    date = new Date();
    id = (Date.now()+"").slice(-10);
    constructor(coords, distance, duration){
        this.coords = coords;
        this.distance = distance;
        this.duration = duration;
    }

    _description(){
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}, ${this.date.getFullYear()}`;
    }
}

class running extends workout{
    type="running";
    constructor(coords, distance, duration, cadence){
        super(coords, distance, duration);
        this.cadence = cadence;
        this._calcPace();
        this._description();
    }

    _calcPace(){
        this.pace = this.duration;
    }
}

class cycling extends workout{
    type="cycling";
    constructor(coords, distance, duration, elevation){
        super(coords, distance, duration);
        this.elevation = elevation;
        this._calcSpeed();
        this._description();
    }

    _calcSpeed(){
        this.speed = this.distance/(this.duration*60);
    }
}

class app{
    #map;
    #mapEvent;
    workouts=[];
    constructor(){
        this._getCurrPosition();
        this._getLocalStorage();

        inputType.addEventListener("change", this._typeToggle.bind(this));
        form.addEventListener("submit", this._addWorkout.bind(this));
        containerWorkouts.addEventListener("click", this._moveToWorkout.bind(this));
    }

    _getCurrPosition(){
        if(navigator.geolocation){
            navigator.geolocation.getCurrentPosition(this._loadmap.bind(this), function(){
                alert("Position undefined")
            });
        }
    }

    _loadmap(position){
        let {latitude, longitude} = position.coords;

        this.#map = L.map('map').setView([latitude, longitude], 13);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        
        this.#map.on("click", this._showForm.bind(this));

        this.workouts.forEach(item => {
            this._addMarker(item);
        });
    }

    _showForm(e){
        this.#mapEvent = e;
        form.classList.remove("hidden");
        inputDuration.focus();
    }

    _typeToggle(e){
        e.preventDefault();
        inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
        inputCadence.closest(".form__row").classList.toggle("form__row--hidden");
    }

    _addWorkout(e){
        e.preventDefault();
        let valid = (...inputs) => inputs.every(inp => Number.isFinite(inp) && inp>0);

        if(inputType.value === "running"){
            if(!valid(+inputCadence.value, +inputDistance.value, +inputDuration.value)){
                alert("Input must be filled and positive");
            }
            else{
                this._addToArray("running");
            }
        }
        else if(inputType.value === "cycling"){
            if(!valid(+inputElevation.value, +inputDistance.value, +inputDuration.value)){
                alert("Input must be filled and positive");
            }
            else{
                this._addToArray("cycling");
            }
        }
    }

    _addToArray(type){
        let newFile;
        if(type==="running"){
            newFile = new running([this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng], inputDistance.value, inputDuration.value, inputCadence.value);
        }
        else{
            newFile = new cycling([this.#mapEvent.latlng.lat, this.#mapEvent.latlng.lng], inputDistance.value, inputDuration.value, inputElevation.value);
        }
        this.workouts.push(newFile);
        this._addMarker(newFile);
        this._resetForm();
        this._hideForm();
        this._showWorkoutList(newFile);
        this._saveLocalStorage();
    }

    _addMarker(workout){
        L.marker([workout.coords[0], workout.coords[1]]).addTo(this.#map)
            .bindPopup(L.popup({
                maxWidth: 250,
                minWidth: 100,
                autoClose: false,
                closeOnClick: false,
                className: `${workout.type}-popup`
            }))
            .setPopupContent(`${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`)
            .openPopup();
    }

    _resetForm(){
        inputCadence.value = inputDistance.value = inputDuration.value = inputElevation.value = "";

        inputType.value = "running";
    }

    _hideForm(){
        form.style.display = "none";
        form.classList.add("hidden");
        setTimeout(function(){
            form.style.display = "grid";
        }, 1000);
    }

    _showWorkoutList(workout){
        let html=`
            <li class="workout workout--${workout.type}" data-id="${workout.id}">
                <h2 class="workout__title">${workout.description}</h2>
                <div class="workout__details">
                    <span class="workout__icon">🏃‍♂️</span>
                    <span class="workout__value">${workout.distance}</span>
                    <span class="workout__unit">km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⏱</span>
                    <span class="workout__value">${workout.duration}</span>
                    <span class="workout__unit">min</span>
                </div>
        `;

        if(workout.type === "running"){
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.pace}</span>
                    <span class="workout__unit">min/km</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">🦶🏼</span>
                    <span class="workout__value">${workout.cadence}</span>
                    <span class="workout__unit">spm</span>
                </div>
            </li>
            `;
        }

        else if(workout.type === "cycling"){
            html+=`
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.speed}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevation}</span>
                    <span class="workout__unit">m</span>
                </div>
            </li>
            `;
        }

        form.insertAdjacentHTML("afterend", html);
    }

    _moveToWorkout(e){
        if(!e.target.closest(".workout")) return;

        let id = e.target.closest(".workout").dataset.id;
        let coords = this.workouts.find(work => work.id === id).coords;
        
        this.#map.setView(coords, 15, {
            animate: true,
            pan:{
                duration: 1,
            }
        })
    }

    _saveLocalStorage(e){
        localStorage.setItem("workouts", JSON.stringify(this.workouts));
    }

    _getLocalStorage(e){
        let data = JSON.parse(localStorage.getItem("workouts"));
        console.log(data);

        if(!data) return;

        this.workouts = data;

        console.log(this.workouts.length);
        this.workouts.forEach(item => {
            this._showWorkoutList(item);
        });
        // localStorage.clear();
    }
}

let run = new app();