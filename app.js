//Budget Controller
var budgetControllerModule = (function(){
    
    /*We need Class/Prototype and we can create multiple objects of it when several income
    or several Expenses are added, thus we create one for each by using function constructor*/
    var Expense = function(id, desc, val){
        this.id = id;
        this.desc = desc;
        this.val = val;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function(totalIncome){

        if(totalIncome > 0){
            this.percentage = Math.round((this.val / totalIncome) * 100);
        }else{
            this.percentage = -1;
        }
        
    };

    Expense.prototype.getPercentage = function(){
        return this.percentage;
    };    

    var Income = function(id, desc, val){
        this.id = id;
        this.desc = desc;
        this.val = val;
    };
    
    /*This contains an Object that contains the Object of 2 Arrays of all Expenses,Incomes
    and one Object Cotaining the total expense and total Income */
    var data = {
        allItems : {
            exp:[], //It will store the array of all Expense objects
            inc:[] ////It will store the array of all Income objects
        },
        totals:{
            exp:0,
            inc:0
        },
        budget : 0,
        percentageSpent:-1 //If we dont have any income or expense, we set it to -1 and not 0
    }

    //An internal that calculates either total income or total Expenses
    var calculateTotal = function(type){
        var sum = 0;
        
        data.allItems[type].forEach(function(currentElement){
            sum += currentElement.val;
            //console.log('sum is '+sum);
        });
        data.totals[type] = sum;
    };

    /*Now we need a method that gets called from outside to add the Expense or Income to our
    data structure right!! */
    return {
        addItem : function(type, desc, val){
            var newItem,ID;

            /*[1 2 3 4 5] thus the next ID is 6
              [1 2 3 5 6 8]* thus the next ID is 9
              So the ID is last element+1 and the last element's  index is length of array -1*/
              if(data.allItems[type].length > 0){
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;      
              }else{
                  ID = 0;
              }
              

            //Create new Object based in inc or exp type    
            if(type === 'inc'){
                //console.log('Bhai add karneka hai');
                //console.log('Yeh aya andar '+desc+' '+val);
                newItem = new Income(ID, desc, val);    

            }else if(type === 'exp'){
                //console.log('Bhai sub karneka hai');      
                //console.log('Yeh aya andar '+desc+' '+val);
                newItem = new Expense(ID, desc, val);
            }

            //Push the item to our data structure
            data.allItems[type].push(newItem);

            //Return the Item for displaying or other use
            return newItem;

        },

        calculateBudget: function(){

            //1. Calculate the total income and total expenses
            calculateTotal('inc');
            calculateTotal('exp');

            //2. Calculate the total budget(income-budget)
            data.budget = data.totals.inc - data.totals.exp;

            //3. calculate the persentage of income money spent
            //If the total income is > 0 or else if 0 then it will give infinity
            if(data.totals.inc > 0){
                data.percentageSpent = Math.round(data.totals.exp / data.totals.inc * 100 );
            }else{
                data.percentageSpent = -1;
            }
            
        },

        getBudget: function(){
            return{
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentageSpent: data.percentageSpent

            };
        },

        //This method calculates the percentages for each element in the data.allItems.exp array
        calculatePercentages : function(){

            data.allItems.exp.forEach(function(currentElement){
                currentElement.calcPercentage(data.totals.inc);
            });
        },

        /*This method is called in the controller to get the percentages of all the expenses
        in the data.allItems.exp array. Map method is used to loop on all of the elements of the
        Array data.allItems.exp and on each of these elements, the prototype method of the Expense
        Prototype getPercentage is called that gets all the percentages stored in the Expense object.
        And then map method returns all the array inside the allExpPercantageArray, that we 
        ultimately return   */
        getPercentages : function(){
            var allExpPercentageArray = data.allItems.exp.map(function(current){
                return current.getPercentage();
            });

            return allExpPercentageArray;
        },

        //As we cannot access the 'data' from outside, we use this method to access it!! 
        testing: function(){
            return data;
        },
            
        deleteItem: function(type, id){
            var ids, index;
            /*Suppose we have the array of ids of incomes like [1 2 4 8 9], and we want to refer 
            the element 4 thus we cannot refer to the element as arr[id] or arr[4] as arr[4] is 9
            thus we need to refer the actual index of the id so the element 4 has index of 2 */

            ids = data.allItems[type].map(function(current){
                return current.id;
            });

            index = ids.indexOf(id);

            if(index !== -1){
                data.allItems[type].splice(index, 1);
                //This method delets the element in the array, index if for the index of id we
                //found out and 1 is for deleting only 1 element
            }
        }
        
    };


})();

//UI Controller
var UIControllerModule = (function(){
    
    var DOMStrings = {
        inputType : '.add__type',
        inputDesc : '.add__description',
        inputVal : '.add__value',
        addButton: '.add__btn',
        incomeContainer: '.income__list', //For selecting the div when we add new item (income or expense) to our UI
        expenseContainer: '.expenses__list', //For selecting the div when we add new item (income or expense) to our UI
        mainBudget: '.budget__value', //For updating the main budget
        totalIncome: '.budget__income--value',  //For updating the main total expense
        totalExpense: '.budget__expenses--value',   //For updating the main total expense
        totalExpensePercentage: '.budget__expenses--percentage', //For updating the total expense %
        container: '.container', //For the delete item by event delegation
        expensePercentage: '.item__percentage', // For the individual expense percentage
        monthAndYear: '.budget__title--month'

    }; /*We use this Object just to store the strings/class names of the HTML elements, in future,
        if the class names are changed, then instead of changing them everywhere, we just change it
        in this Object itself....!!!!
        But this object is only accessible to the inside, in order to let it be accessible for the 
        outside, we define a function that returns this object */

        
    var formatNumber = function(number, type){
        var numSplit, int, dec;
        
        number = Math.abs(number);
        //Here we are taking the abs of no., if the no. is -ve, it will be converted to +ve
        //And also the number will converted to Number Object so that we can use its methods


        //1. + For Income, - for Expense. For ex, 2323 ~ + 2323

        //2. 100 ~ 100.00, 100.235 ~ 100.23
        number = number.toFixed(2);
        numSplit = number.split('.');

        int = numSplit[0];
        dec = numSplit[1];
        
        //3. If number > 999 then add a comma for eg 1000 ~ 1,000
        if(int.length > 3){
            int = int.substr(0, int.length-3) + ',' + int.substr(int.length -3, 3);
            //input 23210 ~ op 23,210
        }
        //This returns a string!!!

        return (type === 'exp' ? '-':'+') + ' ' + int + '.' + dec;
    };

    var nodeListForEach = function(list, callbackFunction){
                
        for(var i=0; i<list.length; i++){
            callbackFunction(list[i], i);     
        }
    };

    return{

        //We created a function getInput that returns an Object with these 3 properties...
        getInput: function(){

            return{
                type: document.querySelector(DOMStrings.inputType).value,
                desc: document.querySelector(DOMStrings.inputDesc).value,
                val: parseFloat(document.querySelector(DOMStrings.inputVal).value),
                //For converting the string to float
            }; 
            

        },

        //This function is created just to return the DOM Strings Object
        getDOMStrings: function(){
            return DOMStrings;
        },

        //This Function is used to add the newly created Expense or Income to our DOM 
        addListItem: function(object, type){
            
            var html,newHTML,element;

            if(type === 'inc'){
                element = DOMStrings.incomeContainer;
                //1. Create HTML String with placeholder text
                //In our case we replaced income-0 with income-%id% as it will be easier for us to replace afterwards
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';        
            }else if(type === 'exp'){
                element = DOMStrings.expenseContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%val%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }
            
            //2. Replace the placeholder text with actual data
            html = html.replace('%id%',object.id);
            html = html.replace('%description%',object.desc);
            //console.log('efefef '+object.desc);
            newHTML = html.replace('%val%', formatNumber(object.val, type));


            //3. Insert HTML into the DOM
            document.querySelector(element).insertAdjacentHTML('beforeend',newHTML);
        },

        //To clear the fields once user has added the budget
        clearFields: function(){

            var fieldsList, fieldsArray;
            fieldsList = document.querySelectorAll(DOMStrings.inputDesc + ', '+DOMStrings.inputVal);
            //We use this function to return a list of selected elements in fieldsList that we need to convert into Array

            fieldsArray = Array.prototype.slice.call(fieldsList);
            /*Slice method is used to convert the list into array but it does not belong to List and belongs
            as the prototype method for Array, thus we use prototype for this purpose...
            Also, we use call because we are passing the fieldsList that is a List so we are tricking the 
            Array that we are passing list instead
            Then we get the output of array!!! */

            fieldsArray.forEach(function(currentElement, index, array){
                currentElement.value = '';
            });
            /*For each works by calling the annonymous function on every element of the fieldsarray
            and, our annony func. takes 3 arguments the currentElement - current element of array
            index - The current index of Array, array - the entire array itself
            And then, we set the value to '' meaning, we are actually clearing the field itself */

            fieldsArray[0].focus();
            /*After clearing the fields, we need the cursor of focus back to the item description */
        },

        updateBudgetUI: function(budget){
            var type;
            
            
            (budget.budget > 0) ? (type = 'inc'): (type = 'exp') ;

            document.querySelector(DOMStrings.mainBudget).textContent = formatNumber(budget.budget, type);
            document.querySelector(DOMStrings.totalIncome).textContent = formatNumber(budget.totalInc, 'inc');
            document.querySelector(DOMStrings.totalExpense).textContent = formatNumber(budget.totalExp, 'exp');
            if(budget.percentageSpent > 0){
                document.querySelector(DOMStrings.totalExpensePercentage).textContent = budget.percentageSpent + '%';
            }else{
                document.querySelector(DOMStrings.totalExpensePercentage).textContent = '---';
            }
            
            
        },

        deleteItemUI : function(selectorID){
            
            var element = document.getElementById(selectorID);
            element.parentNode.removeChild(element);
            /*Here, we want to remove the entire list that contains our added item for ex.
            inc-0, or exp-0 , or inc-1 etc. If we want to delete the inc-0 div, then we cannot do
            that direcctly, instead we have to move one node ahead to parent and then delete its child
            Thus we are passing the element again to removeChild method*/
        },

        displayPercentages: function(percentages){

            var fields = document.querySelectorAll(DOMStrings.expensePercentage);
            /*Now as we can have several items whose percentage we want to display, we use querySelectorAll
            method that returns the NodeList instead. As it does not have a forEach method, we design
            our own forEach method for the nodeList and use it as given below.
            */

            

            nodeListForEach(fields, function(current, index){

                if(percentages[index] > 0){
                    current.textContent = percentages[index] + '%';
                }else{
                    current.textContent = '---';
                }
                
            });
        },

        displayCurrentMonthYear : function(){
            var monthAndYearDOM = document.querySelector(DOMStrings.monthAndYear);

            var monthNames = ["January", "February", "March", "April", "May", "June",
                               "July", "August", "September", "October", "November", "December"
                            ];
            
            var date = new Date();

            monthAndYearDOM.textContent = monthNames[date.getMonth()] + ' ' + date.getFullYear(); 
            //console.log('current year is '+date.getFullYear()); 
            //console.log('current month is '+monthNames[date.getMonth()]);
            

        },

        //If the User choses to add expense instead of income, thus we add a red focus to the 
        //input boxes
        changedType : function(){

            console.log('Called changedType');

            var fields = document.querySelectorAll(
                DOMStrings.inputType + ', ' +
                DOMStrings.inputDesc + ', ' +
                 DOMStrings.inputVal
            );

            //Called the custom forEach method that we madde earlier as querySelectorAll returns a Nodes List and not an Array
            nodeListForEach(fields, function(current){
                current.classList.toggle('red-focus');
            });

            document.querySelector(DOMStrings.addButton).classList.toggle('red');

        }

        
    };

})();

//Global Controller
var controller = (function(bdgtCtlr, UICtlr){

    //Having a function to setup the EventListeners
    var setupEventListeners = function(){

        //The object returned from UImodule that helps us use the DOMStrings
        var DOM = UICtlr.getDOMStrings();
        
        //The Event Listener for the add (tick Mark) button..
        document.querySelector(DOM.addButton).addEventListener('click',ctrlAddItem);
    
        //We need eventListener for enter key pressed to to act same as add button
        //And this is a global event, we attach it to the docuent directly
        document.addEventListener('keypress',function(event){
            if(event.keyCode === 13 || event.which === 13){
                //console.log('Enter was pressed');
                ctrlAddItem();
            }
        })
        /*The 'keypress' is the event that we are looking for and keyCode 13 is for enter key press
        and 'which' is for the older browsers
        A default argument is passed to the function and we name it as event, we can use it determine
        the keypress */

        /*We are setting up event listeners by event delegation for the delete items to the container */
        document.querySelector(DOM.container).addEventListener('click', ctlrDeleteItem);        
    
        /*To improve the UX, we change the focus to red border when user adds the expense or 
        clicks on the -  */
        document.querySelector(DOM.inputType).addEventListener('change', UICtlr.changedType);

    };

    
    var updateBudget = function(){
        //1. Calculate the budget 
        bdgtCtlr.calculateBudget();

        //2. return the Budget
        var budget = bdgtCtlr.getBudget();

        //3. Display the budget on the UI
        console.log(budget);
        UICtlr.updateBudgetUI(budget);
    };

    //To update the percentages of displayed beside the expenses
    var updatePercentages = function(){
        
        //1. Calculate the percentages in budget controller
        bdgtCtlr.calculatePercentages();

        //2. get the percentages from budget controller
        var percentages = bdgtCtlr.getPercentages();

        //3. Update the UI with the updated percentages
        console.log(percentages);
        UICtlr.displayPercentages(percentages);
    };

    //The MAIN function that will take action when Enter is presed or button tick mark is clicked!!
    var ctrlAddItem = function(){
        var input, newItem;

        //1. Get the input fields data
        input = UICtlr.getInput(); //The UICtrl's function is called to get the object that stores the input details 
        
        /*Conditions -
            1. Inuput must not be empty
            2. input value must not be NaN
            3. Input value must be greater than 0 */
        if(input !== '' && !(isNaN(input.val)) && input.val > 0){
            //2. Add the input to the budget controller
            newItem = bdgtCtlr.addItem(input.type, input.desc, input.val);
            

            //3. Add the item to the UI
            UICtlr.addListItem(newItem, input.type);

            //4. Clear the input fields
            UICtlr.clearFields();

            //5. Calculate the budget and update the UI
            updateBudget();

            //6. Calculate the percentages
            updatePercentages();
        }

        
    };

    //To delete the items in income or exp list, we need event here to determine the id of the 
    //income or expense , through event , we can determine the target element selectd and delegete our wy towards top...
    var ctlrDeleteItem = function(event){
        
        var itemID,splitID,type, ID;

        //1. Find out the id and type of the element to delete for ex inc or exp and the id
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;
        
        //If itemID exists or if we click on the cross of the right element to delete..
        if(itemID){
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseFloat(splitID[1]);

            //2. Delete the Item from the Data structure
            bdgtCtlr.deleteItem(type, ID);

            //3. Delete the item from the UI
            UICtlr.deleteItemUI(itemID);

            //4. Update the new budget
            updateBudget();

            //5. Calculate the percentages
            updatePercentages();
        }
    };

    return{
        //The main initializer function that gets called first as the app loads
        init: function(){
            console.log('App has started');
            UICtlr.displayCurrentMonthYear();
            UICtlr.updateBudgetUI({
                budget: 0,
                totalInc: 0,
                totalExp: 0,
                percentageSpent: 0

            }); //We are passing the object with everything set to zero!!!
            setupEventListeners();

        }
    };/*This is the main initialization function that we are returning and is the only public 
        function that we access of the controller method outside the controller, it does the setup
        of the event listeners*/
})(budgetControllerModule, UIControllerModule);

controller.init();