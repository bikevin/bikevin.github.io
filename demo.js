/**
 * Created by Kevin on 8/16/2016.
 */

function startDemo(){

    var dataArray = [];

    Papa.parse('boston_data.txt', {
        download:true,
        complete: function(results, file){

            $.each(results['data'], function(index, value){
               results['data'][index] = value.filter(function(n){return !isNaN(n)});
            });
            dataArray = results;
        },
        delimiter: " ",
        dynamicTyping: true
    });

    return dataArray;
}