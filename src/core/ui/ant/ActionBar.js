/**
 * Created by trump on 2017/8/8.
 */
import React from "react";
const ActionBarClassName = 'ant-helper-ActionBar';
require("./styles/ActionBar.scss");
export class ActionBar extends React.Component {
    static propTypes = {
        pullRight: React.PropTypes.bool,
        pullLeft: React.PropTypes.bool,
        textRight: React.PropTypes.bool,
        textLeft: React.PropTypes.bool,
        marginBottom: React.PropTypes.number,
    };
    
    static defaultProps = {
        marginBottom: 16
    };
    
    render() {
        
        let classNames = [
            ActionBarClassName
        ];
        
        let props = this.props;
        
        props.pullRight && classNames.push('pull-right');
        props.pullLeft && classNames.push('pull-left');
        props.textRight && classNames.push('text-right');
        props.textLeft && classNames.push('text-left');
        
        return <div style={this.getStyles()} className={classNames.join(' ')}>
            {this.props.children}
        </div>
    }
    
    getStyles() {
        let styles = {};
        let props = this.props;
        
        if (props.marginBottom) {
            styles.marginBottom = props.marginBottom;
        }
        return styles;
    }
}