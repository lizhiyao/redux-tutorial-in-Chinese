import React, { Component, PropTypes } from 'react';
import TodoTextInput from './TodoTextInput';


class Header extends Component {
    handleSave(text) {
        if (text.length !== 0) {
            this.props.addTodo(text);
        }
    }
    
    render() {
        return (
            <header className="header">
                <h1>待办事项</h1>
                <TodoTextInput 
                    newTodo
                    onSave={this.handleSave.bind(this)}
                    placeholder='请输入你将要做的事情'
                />
            </header>
        );
    }
}

export default Header;