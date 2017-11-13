/**
 * Created by trump on 2017/8/7.
 */
import React from "react";

export class LinkButton extends React.Component {
    static propTypes = {
        onClick: React.PropTypes.func,
        href: React.PropTypes.string,
        title: React.PropTypes.string,
    };
    
    static defaultProps = {
        href: 'javascript:;'
    };
    
    getTitle = () => {
        if (this.props.title !== undefined) {
            return this.props.title;
        }
        
        if (typeof this.props.children === 'string') {
            return this.props.children;
        }
    };
    
    render() {
        return <a {...this.props} title={this.getTitle()}>{this.props.children}</a>
    }
}
