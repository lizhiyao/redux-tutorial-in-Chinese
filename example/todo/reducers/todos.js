import { ADD_TODO, DELETE_TODO, EDIT_TODO, COMPLETE_TODO, COMPLETE_ALL, CLEAR_COMPLETED } from '../constants/ActionTypes';


const initialState = [
    {
        text: 'Learn redux-form',
        completed: false,
        id: 0
    }
]; 